import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

// Paths to log files
const SERVER_LOG_PATH = path.join(process.cwd(), 'logs', 'server.log');
const ERROR_LOG_PATH = path.join(process.cwd(), 'logs', 'error.log');
const APP_LOG_PATH = path.join(process.cwd(), 'logs', 'app.log');
const CONSOLE_LOG_PATH = path.join(process.cwd(), 'logs', 'console.log');

// Ensure log directory exists
async function ensureLogDirectory() {
  const logDir = path.join(process.cwd(), 'logs');
  try {
    await fs.access(logDir);
  } catch (error) {
    await fs.mkdir(logDir, { recursive: true });
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureLogDirectory();
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Read log files based on type
    let logs: any[] = [];
    
    if (type === 'all' || type === 'error') {
      try {
        const errorContent = await fs.readFile(ERROR_LOG_PATH, 'utf-8').catch(() => '');
        if (errorContent) {
          const errorLogs = parseLogContent(errorContent, 'error');
          logs = [...logs, ...errorLogs];
        }
      } catch (error) {
        console.error('Failed to read error logs:', error);
      }
    }
    
    if (type === 'all' || type === 'server') {
      try {
        const serverContent = await fs.readFile(SERVER_LOG_PATH, 'utf-8').catch(() => '');
        if (serverContent) {
          const serverLogs = parseLogContent(serverContent, 'server');
          logs = [...logs, ...serverLogs];
        }
      } catch (error) {
        console.error('Failed to read server logs:', error);
      }
    }
    
    if (type === 'all' || type === 'app') {
      try {
        const appContent = await fs.readFile(APP_LOG_PATH, 'utf-8').catch(() => '');
        if (appContent) {
          const appLogs = parseLogContent(appContent, 'app');
          logs = [...logs, ...appLogs];
        }
      } catch (error) {
        console.error('Failed to read app logs:', error);
      }
    }
    
    if (type === 'all' || type === 'console') {
      try {
        const consoleContent = await fs.readFile(CONSOLE_LOG_PATH, 'utf-8').catch(() => '');
        if (consoleContent) {
          const consoleLogs = parseLogContent(consoleContent, 'console');
          logs = [...logs, ...consoleLogs];
        }
      } catch (error) {
        console.error('Failed to read console logs:', error);
      }
    }
    
    // Sort logs by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply limit
    logs = logs.slice(0, limit);
    
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

// Log writing endpoint for client-side errors
export async function POST(req: NextRequest) {
  try {
    await ensureLogDirectory();
    
    const body = await req.json();
    const { level = 'error', component, message, details } = body;
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Create log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: component || 'Unknown',
      message,
      details: details || '',
    };
    
    // Append to appropriate log file
    const targetPath = level === 'error' ? ERROR_LOG_PATH : APP_LOG_PATH;
    const logContent = `${JSON.stringify(logEntry)}\n`;
    
    await fs.appendFile(targetPath, logContent);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing log:', error);
    return NextResponse.json({ error: 'Failed to write log' }, { status: 500 });
  }
}

// Helper function to parse log content
function parseLogContent(content: string, source: string): any[] {
  try {
    const lines = content.trim().split('\n');
    return lines
      .filter(line => line.trim())
      .map((line, index) => {
        try {
          const parsedLine = JSON.parse(line);
          return {
            id: `${source}-${index}`,
            timestamp: parsedLine.timestamp || new Date().toISOString(),
            level: parsedLine.level || 'info',
            component: parsedLine.component || source,
            message: parsedLine.message || 'Unknown error',
            details: parsedLine.details || '',
            resolved: parsedLine.resolved || false,
            source
          };
        } catch (e) {
          // Handle non-JSON log lines
          return {
            id: `${source}-${index}`,
            timestamp: new Date().toISOString(),
            level: 'info',
            component: source,
            message: line,
            details: '',
            resolved: false,
            source
          };
        }
      });
  } catch (error) {
    console.error('Failed to parse log content:', error);
    return [];
  }
}
