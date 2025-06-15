'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2 } from 'lucide-react';

interface PluginUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function PluginUploadDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: PluginUploadDialogProps): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [pluginType, setPluginType] = useState<string>('core');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.zip')) {
        toast({
          title: 'Invalid file format',
          description: 'Please upload a .zip file',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPluginType('core');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a plugin zip file to upload',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate zip file extension again
    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast({
        title: 'Invalid file format',
        description: 'Plugin must be a .zip file containing plugin.json or manifest.json',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create a new FormData instance
      const formData = new FormData();
      
      // Log file info for debugging
      console.log('Uploading file:', { name: file.name, type: file.type, size: file.size });
      
      // Use 'file' as the field name to match the API expectation
      formData.append('file', file);
      formData.append('pluginType', pluginType);
      
      // Log the form data contents for debugging
      console.log('Form data entries:');
      for (const pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
      
      // Make the fetch request with the form data
      const response = await fetch('/api/plugins/upload', {
        method: 'POST',
        body: formData,
      });
      
      // Get response text first for better debugging
      const responseText = await response.text();
      console.log('Raw upload response:', responseText);
      
      // Check response status
      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
          console.error('Upload API error:', { status: response.status, data: errorData });
        } catch (e) {
          console.error('Upload API error (non-JSON):', { status: response.status, text: responseText });
        }
        throw new Error(errorMessage);
      }
      
      // Parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Plugin upload successful:', data);
      } catch (e) {
        console.error('Failed to parse upload response as JSON:', e);
        throw new Error('Invalid response format from upload API');
      }
      
      // Show success toast
      toast({
        title: 'Plugin Uploaded Successfully',
        description: `The plugin has been uploaded and registered.`,
      });
      
      // Call onSuccess without arguments as expected by its type
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload plugin',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Plugin</DialogTitle>
          <DialogDescription>
            Upload a plugin zip file to install it in the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="plugin-file">Plugin File</Label>
            <Input
              id="plugin-file"
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            <p className="text-sm text-muted-foreground">
              Must be a .zip file containing a valid plugin structure
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plugin-type">Plugin Type</Label>
            <Select value={pluginType} onValueChange={setPluginType}>
              <SelectTrigger id="plugin-type">
                <SelectValue placeholder="Select plugin type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="development">Development</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {pluginType === 'core' && 'Core plugins are available to all hospitals'}
              {pluginType === 'premium' && 'Premium plugins require separate licensing'}
              {pluginType === 'development' && 'Development plugins are for testing only'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Plugin
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
