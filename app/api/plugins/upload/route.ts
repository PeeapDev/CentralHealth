/**
 * API Route: /api/plugins/upload
 * 
 * Handles plugin file uploads and extraction
 */

import { NextRequest, NextResponse } from 'next/server';
// Commented out for testing purposes
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import * as fs from 'fs';
import path from 'path';
import { loadPluginFromPath } from '@/lib/plugin-system/loader';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';

const execPromise = promisify(exec);

/**
 * Helper function to find plugin.json or manifest.json files recursively
 */
function findManifestFile(dir: string): string | null {
  try {
    // Check if plugin.json exists at this level
    const pluginJsonPath = path.join(dir, 'plugin.json');
    if (fs.existsSync(pluginJsonPath)) {
      return pluginJsonPath;
    }
    
    // Check if manifest.json exists at this level
    const manifestJsonPath = path.join(dir, 'manifest.json');
    if (fs.existsSync(manifestJsonPath)) {
      return manifestJsonPath;
    }
    
    // If not found, check all subdirectories
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory()) {
        const subdirPath = path.join(dir, item.name);
        const result = findManifestFile(subdirPath);
        if (result) return result;
      }
    }
    
    // Not found in this directory or any subdirectories
    return null;
  } catch (error) {
    console.error(`Error searching for manifest in ${dir}:`, error);
    return null;
  }
}

/**
 * Helper function to extract a zip file
 */
async function extractZip(zipPath: string, targetDir: string): Promise<boolean> {
  try {
    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    // Use unzip command (works on macOS, Linux)
    await execPromise(`unzip -o "${zipPath}" -d "${targetDir}"`);
    return true;
  } catch (error) {
    console.error('Error extracting zip file:', error);
    return false;
  }
}

/**
 * POST: Upload and install a plugin
 */
export async function POST(req: NextRequest) {
  try {
    // TEMPORARY: Bypassing authentication for testing
    // const session = await getServerSession(authOptions);
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // TEMPORARY: Mock session for testing
    const session = { user: { email: 'admin@test.com', role: 'superadmin' } };
    
    // Check if user is a superadmin
    if (session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Handle file upload using FormData
    const formData = await req.formData();
    const pluginFile = formData.get('file') as File; // Changed from 'pluginFile' to 'file' to match frontend
    
    if (!pluginFile) {
      return NextResponse.json({ error: 'No plugin file provided' }, { status: 400 });
    }
    
    console.log('Received plugin file:', pluginFile.name);
    
    // Ensure it's a zip file
    if (!pluginFile.name.endsWith('.zip')) {
      return NextResponse.json({ error: 'Plugin file must be a .zip archive' }, { status: 400 });
    }
    
    // Get plugin type from form data (premium or development)
    const pluginType = formData.get('pluginType') as string || 'development';
    
    if (!['premium', 'core', 'development'].includes(pluginType)) {
      return NextResponse.json({ error: 'Invalid plugin type' }, { status: 400 });
    }
    
    // Create temp directory for processing
    const tempDir = path.join(os.tmpdir(), 'plugin-upload-' + uuidv4());
    await mkdir(tempDir, { recursive: true });
    
    // Write zip file to temp directory
    const zipPath = path.join(tempDir, pluginFile.name);
    const zipBuffer = Buffer.from(await pluginFile.arrayBuffer());
    await writeFile(zipPath, zipBuffer);
    
    // Create directory for plugin extraction
    const extractDir = path.join(tempDir, 'extract');
    
    // Extract zip file
    const extracted = await extractZip(zipPath, extractDir);
    
    if (!extracted) {
      return NextResponse.json({ error: 'Failed to extract plugin archive' }, { status: 500 });
    }
    
    // Find plugin manifest file (plugin.json or manifest.json) in any directory
    console.log('Searching for manifest file in:', extractDir);
    const manifestFilePath = findManifestFile(extractDir);
    
    // Debug the directory structure to help troubleshoot
    try {
      console.log('Files in the extracted directory:');
      const listFiles = (dir: string, indent = '  '): void => {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          console.log(`${indent}${item.name}${item.isDirectory() ? '/' : ''}`);
          if (item.isDirectory()) {
            listFiles(path.join(dir, item.name), indent + '  ');
          }
        }
      };
      listFiles(extractDir);
    } catch (error) {
      console.error('Error listing directory structure:', error);
    }
    
    // Check if we found a manifest file
    if (!manifestFilePath) {
      console.error('Plugin zip missing both plugin.json and manifest.json in all directories');
      return NextResponse.json({ error: 'Invalid plugin: missing plugin manifest file (plugin.json or manifest.json)' }, { status: 400 });
    }
    
    console.log(`Found manifest file at: ${manifestFilePath}`);
    const actualManifestPath = manifestFilePath;
    console.log(`Using manifest file: ${actualManifestPath}`);
    
    // Read plugin manifest file to get plugin details
    let pluginJson;
    try {
      const manifestContent = fs.readFileSync(actualManifestPath, 'utf8');
      console.log('Manifest content:', manifestContent.substring(0, 200) + '...'); // Log first 200 chars
      pluginJson = JSON.parse(manifestContent);
    } catch (error) {
      console.error('Error parsing manifest file:', error);
      return NextResponse.json({ 
        error: 'Invalid plugin: manifest file is not valid JSON', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, { status: 400 });
    }
    
    if (!pluginJson.name) {
      return NextResponse.json({ error: 'Invalid plugin: missing name in manifest file' }, { status: 400 });
    }
    
    // Create final plugin directory
    const pluginsBaseDir = path.join(process.cwd(), 'plugins');
    const typeDir = path.join(pluginsBaseDir, pluginType); // Use pluginType (core, premium, development)
    const pluginDirName = pluginJson.name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const pluginDir = path.join(typeDir, pluginDirName);
    
    console.log(`Plugin name: ${pluginJson.name}, sanitized to: ${pluginDirName}`);
    console.log(`Plugin directory will be: ${pluginDir}`);
    
    // Ensure plugins base directory and type directory exist
    try {
      if (!fs.existsSync(pluginsBaseDir)) {
        await mkdir(pluginsBaseDir, { recursive: true });
        console.log(`Created plugins base directory: ${pluginsBaseDir}`);
      }
      
      if (!fs.existsSync(typeDir)) {
        await mkdir(typeDir, { recursive: true });
        console.log(`Created plugin type directory: ${typeDir}`);
      }
    } catch (dirError) {
      console.error('Failed to create plugins directory:', dirError);
      return NextResponse.json({ 
        error: 'Failed to create plugins directory', 
        details: dirError instanceof Error ? dirError.message : 'Unknown error' 
      }, { status: 500 });
    }
    
    // Clean up existing plugin directory if it exists
    if (fs.existsSync(pluginDir)) {
      try {
        console.log(`Removing existing plugin directory: ${pluginDir}`);
        // Use execPromise to run rm -rf command (careful with this!)
        await execPromise(`rm -rf "${pluginDir}"`);
      } catch (cleanupError) {
        console.error('Failed to clean up existing plugin directory:', cleanupError);
        return NextResponse.json({ 
          error: 'Failed to remove existing plugin directory', 
          details: cleanupError instanceof Error ? cleanupError.message : 'Unknown error' 
        }, { status: 500 });
      }
    }
    
    // Copy extracted files to plugin directory
    try {
      // First, make sure the target directory exists
      await mkdir(pluginDir, { recursive: true });
      console.log(`Created plugin directory: ${pluginDir}`);
      
      // Then copy the files
      await execPromise(`cp -R "${extractDir}"/* "${pluginDir}"`);
      console.log(`Plugin files copied to: ${pluginDir}`);
    } catch (copyError) {
      console.error('Failed to copy plugin files:', copyError);
      return NextResponse.json({ 
        error: 'Failed to copy plugin files to destination directory', 
        details: copyError instanceof Error ? copyError.message : 'Unknown error' 
      }, { status: 500 });
    }
    
    // Load the plugin into the registry
    let pluginId;
    try {
      pluginId = await loadPluginFromPath(pluginDir);
      
      if (!pluginId) {
        return NextResponse.json({ error: 'Failed to load plugin, no plugin ID returned' }, { status: 500 });
      }
      console.log(`Successfully loaded plugin with ID: ${pluginId}`);
    } catch (loadError) {
      console.error('Failed to load plugin:', loadError);
      return NextResponse.json({
        error: 'Failed to load plugin', 
        details: loadError instanceof Error ? loadError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Register plugin in the database
    try {
      // Check if plugin already exists in database
      const existingPlugin = await (prisma as any).plugin.findFirst({
        where: { name: pluginJson.name }
      }).catch((err: any) => {
        console.warn('Error finding existing plugin, table might not exist yet:', err);
        return null;
      });
      
      if (existingPlugin) {
        // Update existing plugin
        await (prisma as any).plugin.update({
          where: { id: existingPlugin.id },
          data: {
            version: pluginJson.version || '0.0.0',
            description: pluginJson.description || '',
            category: pluginJson.category || 'uncategorized',
            author: pluginJson.author || 'Unknown',
            path: pluginDir,
            updatedAt: new Date(),
            // Add any other fields you want to update
          }
        });
        console.log(`Updated existing plugin in database: ${existingPlugin.id}`);
      } else {
        // Create new plugin entry
        const newPlugin = await (prisma as any).plugin.create({
          data: {
            name: pluginJson.name,
            version: pluginJson.version || '0.0.0',
            description: pluginJson.description || '',
            category: pluginJson.category || 'uncategorized',
            author: pluginJson.author || 'Unknown',
            path: pluginDir,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Add any other fields you want to create
          }
        });
        console.log(`Created new plugin in database: ${newPlugin.id}`);
      }
    } catch (dbError) {
      console.error('Failed to register plugin in database:', dbError);
      return NextResponse.json({
        error: 'Failed to register plugin in database',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    return NextResponse.json({
      success: true,
      plugin: {
        id: pluginId,
        name: pluginJson.name,
        version: pluginJson.version,
        path: pluginDir
      }
    });
  } catch (error) {
    console.error('Error uploading plugin:', error);
    return NextResponse.json({ error: 'Failed to upload plugin' }, { status: 500 });
  }
}
