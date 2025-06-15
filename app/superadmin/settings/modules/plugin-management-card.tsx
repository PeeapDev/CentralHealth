'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, Download, Settings, Trash, Upload } from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  isActive?: boolean;
}

interface PluginManagementCardProps {
  plugin: Plugin;
  hospitalId: string;
  onUpdate: () => void;
}

export function PluginManagementCard({ plugin, hospitalId, onUpdate }: PluginManagementCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(plugin.isActive || false);

  const handleToggleActive = async () => {
    setIsLoading(true);
    try {
      const newActiveState = !isActive;
      
      const response = await fetch('/api/plugins/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pluginId: plugin.id,
          hospitalId,
          active: newActiveState,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${newActiveState ? 'activate' : 'deactivate'} plugin`);
      }

      setIsActive(newActiveState);
      toast({
        title: newActiveState ? 'Plugin Activated' : 'Plugin Deactivated',
        description: `${plugin.name} has been ${newActiveState ? 'activated' : 'deactivated'} successfully.`,
      });
      
      // Notify parent component to update the list
      onUpdate();
    } catch (error) {
      console.error('Error toggling plugin status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update plugin status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/40">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{plugin.name}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Version {plugin.version} • By {plugin.author}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={plugin.category === 'core' ? 'secondary' : 'outline'}>
              {plugin.category === 'core' ? 'Core' : 'Premium'}
            </Badge>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                {isActive ? 'Active' : 'Inactive'}
              </span>
              <Switch
                checked={isActive}
                onCheckedChange={handleToggleActive}
                disabled={isLoading || plugin.category === 'core'}
                aria-label={`${isActive ? 'Deactivate' : 'Activate'} ${plugin.name} plugin`}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-sm">{plugin.description}</p>
        
        {!isActive && (
          <div className="mt-4 flex items-center p-3 border rounded-md bg-muted/30">
            <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              This plugin is currently deactivated. No features will be available until activated.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/20 px-6 py-3">
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm" disabled={!isActive}>
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <div className="space-x-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Update
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={plugin.category === 'core'}
              className="text-destructive hover:text-destructive"
            >
              <Trash className="h-4 w-4 mr-2" />
              Uninstall
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
