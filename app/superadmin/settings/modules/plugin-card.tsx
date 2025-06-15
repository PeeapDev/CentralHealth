/**
 * Plugin Card Component for Module Management
 * 
 * Displays a plugin's information and activation controls
 */

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
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Cog, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export interface PluginCardProps {
  plugin: {
    id: string;
    name: string;
    version: string;
    category: string;
    author: string;
    description: string;
    isActive?: boolean;
    activatedAt?: Date | null;
    path?: string;
    crossHospitalCompatible?: boolean;
  };
  hospitalId: string;
  onActivationToggle: (active: boolean) => Promise<boolean>;
  onConfigureClick: () => void;
}

export default function PluginCard({
  plugin,
  hospitalId,
  onActivationToggle,
  onConfigureClick
}: PluginCardProps) {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(plugin.isActive || false);
  const [isLoading, setIsLoading] = useState(false);

  // Format date nicely
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };
  
  // Handle activation toggle
  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      const success = await onActivationToggle(checked);
      if (success) {
        setIsActive(checked);
        toast({
          title: checked ? 'Plugin activated' : 'Plugin deactivated',
          description: `${plugin.name} is now ${checked ? 'active' : 'inactive'}.`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Action failed',
          description: `Failed to ${checked ? 'activate' : 'deactivate'} the plugin.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling plugin activation:', error);
      toast({
        title: 'Error',
        description: `An error occurred while ${checked ? 'activating' : 'deactivating'} the plugin.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`w-full ${isActive ? 'border-primary/20 bg-primary/5' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{plugin.name}</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              {plugin.version} • {plugin.author}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={plugin.category === 'core' ? 'default' : plugin.category === 'premium' ? 'secondary' : 'outline'}>
              {plugin.category}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Active</span>
              <Switch 
                checked={isActive}
                onCheckedChange={handleToggle}
                disabled={isLoading}
                aria-label={isActive ? 'Deactivate plugin' : 'Activate plugin'}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{plugin.description}</p>
        
        {plugin.crossHospitalCompatible === false && (
          <div className="mt-2 flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-md">
            <AlertCircle size={16} />
            <span className="text-xs">This plugin is not compatible with cross-hospital patient data</span>
          </div>
        )}
        
        {isActive && (
          <div className="mt-2 text-xs text-gray-500">
            Activated: {formatDate(plugin.activatedAt)}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onConfigureClick}
          disabled={!isActive}
          className={!isActive ? 'opacity-50' : ''}
        >
          <Cog className="mr-2 h-4 w-4" /> Configure
        </Button>
        {plugin.category !== 'core' && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <Link href={`/superadmin/settings/modules/${plugin.id}/analytics`}>
                Analytics
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
              disabled={isLoading || isActive}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
