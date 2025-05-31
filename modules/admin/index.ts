import { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { extractAndInstallModule } from '../../utils/moduleInstaller';

/**
 * Admin Module - Provides administrative functions including module management
 * @param app Express application
 */
export default function register(app: Express): void {
  console.log('Registering admin module routes...');

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(__dirname, '../../uploads');
      
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      // Generate a unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `module-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });

  // Create upload middleware
  const upload = multer({ 
    storage: storage,
    fileFilter: function(req, file, cb) {
      // Only accept zip files
      if (path.extname(file.originalname).toLowerCase() !== '.zip') {
        return cb(new Error('Only zip files are allowed'));
      }
      cb(null, true);
    }
  });

  // Module upload endpoint
  app.post('/admin/modules/upload', upload.single('moduleFile'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }

      // Extract and install the module
      const moduleInfo = await extractAndInstallModule(req.file.path);

      // Return success response
      res.status(200).json({
        success: true,
        message: 'Module uploaded and installed successfully',
        module: moduleInfo
      });
    } catch (error) {
      console.error('Error uploading module:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload and install module'
      });
    }
  });

  // Get list of installed modules
  app.get('/admin/modules', (req: Request, res: Response) => {
    try {
      const configPath = path.join(__dirname, '../../moduleConfig.json');
      
      if (!fs.existsSync(configPath)) {
        return res.status(404).json({
          success: false,
          message: 'Module configuration not found'
        });
      }

      const configContent = fs.readFileSync(configPath, 'utf-8');
      const moduleConfig = JSON.parse(configContent);

      res.json({
        success: true,
        modules: moduleConfig.modules || []
      });
    } catch (error) {
      console.error('Error getting modules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get modules'
      });
    }
  });

  // Enable/disable a module
  app.patch('/admin/modules/:moduleName', (req: Request, res: Response) => {
    try {
      const { moduleName } = req.params;
      const { enabled } = req.body;

      const configPath = path.join(__dirname, '../../moduleConfig.json');
      
      if (!fs.existsSync(configPath)) {
        return res.status(404).json({
          success: false,
          message: 'Module configuration not found'
        });
      }

      const configContent = fs.readFileSync(configPath, 'utf-8');
      const moduleConfig = JSON.parse(configContent);

      // Find and update the module
      const moduleIndex = moduleConfig.modules.findIndex(m => m.name === moduleName);
      
      if (moduleIndex === -1) {
        return res.status(404).json({
          success: false,
          message: `Module ${moduleName} not found`
        });
      }

      // Update module status
      moduleConfig.modules[moduleIndex].enabled = enabled;

      // Save config
      fs.writeFileSync(configPath, JSON.stringify(moduleConfig, null, 2));

      res.json({
        success: true,
        message: `Module ${moduleName} ${enabled ? 'enabled' : 'disabled'} successfully`,
        module: moduleConfig.modules[moduleIndex]
      });
    } catch (error) {
      console.error('Error updating module:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update module'
      });
    }
  });

  // Uninstall a module
  app.delete('/admin/modules/:moduleName', (req: Request, res: Response) => {
    try {
      const { moduleName } = req.params;

      const configPath = path.join(__dirname, '../../moduleConfig.json');
      
      if (!fs.existsSync(configPath)) {
        return res.status(404).json({
          success: false,
          message: 'Module configuration not found'
        });
      }

      const configContent = fs.readFileSync(configPath, 'utf-8');
      const moduleConfig = JSON.parse(configContent);

      // Find the module
      const moduleIndex = moduleConfig.modules.findIndex(m => m.name === moduleName);
      
      if (moduleIndex === -1) {
        return res.status(404).json({
          success: false,
          message: `Module ${moduleName} not found`
        });
      }

      // Remove module from config
      const removedModule = moduleConfig.modules.splice(moduleIndex, 1)[0];

      // Save config
      fs.writeFileSync(configPath, JSON.stringify(moduleConfig, null, 2));

      // Note: In a real implementation, you would also remove the module files
      // from the filesystem, but we'll skip that for simplicity

      res.json({
        success: true,
        message: `Module ${moduleName} uninstalled successfully`,
        module: removedModule
      });
    } catch (error) {
      console.error('Error uninstalling module:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to uninstall module'
      });
    }
  });

  console.log('Admin module routes registered successfully');
}
