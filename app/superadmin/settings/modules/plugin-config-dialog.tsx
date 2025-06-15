/**
 * Plugin Configuration Dialog
 * 
 * Dialog for configuring plugin settings
 */

'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PluginConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plugin: {
    id: string;
    name: string;
    version: string;
    category: string;
  };
  hospitalId: string;
  settings: Record<string, any>;
  onSave: (settings: Record<string, any>) => Promise<boolean>;
}

export default function PluginConfigDialog({
  open,
  onOpenChange,
  plugin,
  hospitalId,
  settings: initialSettings,
  onSave,
}: PluginConfigDialogProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, any>>(initialSettings || {});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  // Reset settings when the dialog opens with new plugin
  useEffect(() => {
    if (open) {
      setSettings(initialSettings || {});
    }
  }, [open, initialSettings, plugin.id]);
  
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const success = await onSave(settings);
      if (success) {
        toast({
          title: 'Settings saved',
          description: `Settings for ${plugin.name} have been updated.`,
          variant: 'default',
        });
        onOpenChange(false);
      } else {
        toast({
          title: 'Save failed',
          description: 'Failed to save plugin settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving plugin settings:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while saving plugin settings.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle input change for any setting
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Function to render appropriate input for different setting types
  const renderSettingInput = (key: string, value: any) => {
    // If the setting is a boolean, render a switch
    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center space-x-2" key={key}>
          <Switch
            id={key}
            checked={value}
            onCheckedChange={(checked) => handleSettingChange(key, checked)}
          />
          <Label htmlFor={key}>{formatSettingName(key)}</Label>
        </div>
      );
    }
    
    // If the setting is a multiline string, render a textarea
    if (typeof value === 'string' && value.includes('\n')) {
      return (
        <div className="grid gap-2" key={key}>
          <Label htmlFor={key}>{formatSettingName(key)}</Label>
          <Textarea
            id={key}
            value={value}
            onChange={(e) => handleSettingChange(key, e.target.value)}
            rows={4}
          />
        </div>
      );
    }
    
    // For other types, render an input
    return (
      <div className="grid gap-2" key={key}>
        <Label htmlFor={key}>{formatSettingName(key)}</Label>
        <Input
          id={key}
          value={value}
          onChange={(e) => handleSettingChange(key, e.target.value)}
          type={typeof value === 'number' ? 'number' : 'text'}
        />
      </div>
    );
  };
  
  // Helper function to format setting keys as readable labels
  const formatSettingName = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, ' ');
  };
  
  // Group settings by category if they have a prefix like "general_", "notifications_", etc.
  const groupedSettings = Object.entries(settings).reduce<Record<string, Record<string, any>>>(
    (groups, [key, value]) => {
      const categoryMatch = key.match(/^([a-z]+)_(.+)/);
      const category = categoryMatch ? categoryMatch[1] : 'general';
      const actualKey = categoryMatch ? categoryMatch[2] : key;
      
      if (!groups[category]) {
        groups[category] = {};
      }
      
      groups[category][actualKey] = value;
      return groups;
    }, 
    {}
  );
  
  // Get all available categories
  const categories = Object.keys(groupedSettings).length > 0 
    ? Object.keys(groupedSettings) 
    : ['general'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Configure {plugin.name}</DialogTitle>
          <DialogDescription>
            Customize the plugin settings for your hospital.
          </DialogDescription>
        </DialogHeader>
        
        {categories.length > 1 ? (
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-4">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {formatSettingName(category)}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categories.map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                {Object.entries(groupedSettings[category] || {}).map(([key, value]) => 
                  renderSettingInput(key, value)
                )}
                
                {/* Show message if no settings in this category */}
                {(!groupedSettings[category] || Object.keys(groupedSettings[category]).length === 0) && (
                  <div className="text-center py-4 text-gray-500">
                    No {category} settings available for this plugin.
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="space-y-4 py-2">
            {Object.entries(settings).map(([key, value]) => 
              renderSettingInput(key, value)
            )}
            
            {/* Show message if no settings */}
            {Object.keys(settings).length === 0 && (
              <div className="text-center py-4 text-gray-500">
                This plugin has no configurable settings.
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
