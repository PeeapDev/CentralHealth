/**
 * Plugin List Component
 * 
 * This component integrates with the new plugin system and can be used 
 * in the modules page to display and manage plugins
 */

'use client';

import { useState, useEffect } from 'react';
// Auth will be implemented later
import { useToast } from '@/components/ui/use-toast';
import { Package, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PluginManagementCard } from './plugin-management-card';
import PluginConfigDialog from './plugin-config-dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Plugin {
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
  settings?: Record<string, any>;
}

export default function PluginList() {
  const { toast } = useToast();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Get default hospital ID
  const defaultHospitalId = 'default';

  // Fetch plugins on component mount
  useEffect(() => {
    // Always fetch plugins 
    fetchPlugins();
  }, []);

  // Fetch all plugins
  const fetchPlugins = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching plugins from API...');
      const response = await fetch(`/api/plugins?hospitalId=${defaultHospitalId}`, {
        // Add cache: 'no-store' to prevent stale cache issues
        cache: 'no-store',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Parse response JSON
      let data;
      try {
        data = await response.json();
        console.log('Plugins API response:', data);
      } catch (parseError) {
        console.error('Failed to parse API response as JSON:', parseError);
        // Instead of throwing an error, set empty plugins list
        setPlugins([]);
        setIsLoading(false);
        return;
      }
      
      // Check for response errors but don't display them if it's just an empty plugins list
      if (!response.ok && response.status !== 404) {
        console.warn('API returned error status:', response.status);
        // Just log the error but don't display it to the user
        // We'll handle empty plugin lists gracefully
      }
      
      // Handle both array format and plugins property format
      const pluginList = Array.isArray(data) ? data : (data.plugins || []);
      
      // Normalize plugins to ensure all required fields are present
      const normalizedPlugins = pluginList.map(plugin => {
        if (!plugin) return null;
        return {
          id: plugin.id || `plugin-${Math.random().toString(36).substring(2, 9)}`,
          name: plugin.name || 'Unknown Plugin',
          version: plugin.version || '0.0.0',
          description: plugin.description || '',
          category: plugin.category || 'uncategorized',
          author: plugin.author || 'Unknown',
          isActive: !!plugin.isActive,
          activatedAt: plugin.activatedAt || null,
          path: plugin.path || '',
          crossHospitalCompatible: plugin.crossHospitalCompatible !== false,
          settings: plugin.settings || {}
        };
      }).filter(Boolean); // Remove any null entries
      
      setPlugins(normalizedPlugins);
      
      if (normalizedPlugins.length === 0) {
        console.log('No plugins installed - showing empty state');
      }
    } catch (err) {
      // Log error but don't display to user if it's just about missing plugins
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching plugins';
      console.warn('Plugin fetch warning:', errorMessage);
      
      // Only set error if it's not related to missing plugins/tables
      if (errorMessage.includes('plugin') && 
          (errorMessage.includes('table') || errorMessage.includes('missing'))) {
        // This is likely just a case of no plugins installed yet, don't show error
        console.log('No plugins installed yet - suppressing error');
      } else if (!errorMessage.includes('Failed to fetch plugins')) {
        // Only show toast for serious errors, not for empty plugin lists
        setError(`Error: ${errorMessage}`);
        
        toast({
          title: 'Database connection issue',
          description: 'There was a problem connecting to the database',
          variant: 'destructive',
        });
      }
      
      // Always set empty array to prevent UI errors
      setPlugins([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle plugin activation toggle
  const handleActivationToggle = async (plugin: Plugin, active: boolean) => {
    try {
      const method = active ? 'PUT' : 'DELETE';
      const url = active 
        ? `/api/plugins/${encodeURIComponent(plugin.name)}`
        : `/api/plugins/${encodeURIComponent(plugin.name)}?hospitalId=${defaultHospitalId}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(active && { body: JSON.stringify({ hospitalId: defaultHospitalId }) }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${active ? 'activate' : 'deactivate'} plugin`);
      }
      
      // Update local state
      setPlugins(prev => prev.map(p => 
        p.id === plugin.id ? { ...p, isActive: active } : p
      ));
      
      return true;
    } catch (error) {
      console.error(`Error ${active ? 'activating' : 'deactivating'} plugin:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${active ? 'activate' : 'deactivate'} plugin.`,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Handle plugin configuration
  const handleConfigurePlugin = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setConfigDialogOpen(true);
  };

  // Save plugin settings
  const handleSaveSettings = async (settings: Record<string, any>) => {
    if (!selectedPlugin) return false;
    
    try {
      const response = await fetch(`/api/plugins/${encodeURIComponent(selectedPlugin.name)}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hospitalId: defaultHospitalId,
          settings,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update plugin settings');
      }
      
      // Update local state
      setPlugins(prev => prev.map(p => 
        p.id === selectedPlugin.id ? { ...p, settings } : p
      ));
      
      return true;
    } catch (error) {
      console.error('Error saving plugin settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save plugin settings.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Make sure plugins is an array and all plugin objects have the required properties
  const safePlugins = Array.isArray(plugins) ? plugins : [];
  
  // Filter plugins by search query and category
  const filteredPlugins = safePlugins.filter(plugin => {
    if (!plugin || typeof plugin !== 'object') return false;
    
    // Ensure required properties exist with defaults if missing
    const name = plugin.name || '';
    const description = plugin.description || '';
    const author = plugin.author || '';
    const category = plugin.category || 'other';
    
    const matchesSearch = searchQuery === '' || 
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      author.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = categoryFilter === null || category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filtering - safely handle missing categories
  const categories = [...new Set(safePlugins
    .map(p => p?.category || 'other')
    .filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Badge 
            variant={categoryFilter === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCategoryFilter(null)}
          >
            All
          </Badge>
          {categories.map(category => (
            <Badge
              key={category}
              variant={categoryFilter === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategoryFilter(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={fetchPlugins}
          disabled={isLoading}
          className="sm:w-auto w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-700">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* No plugins found */}
      {!isLoading && !error && filteredPlugins.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>
              {searchQuery || categoryFilter
                ? 'No plugins match your search criteria.'
                : 'No plugins are currently installed. Upload or install a plugin to get started.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Plugin list */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {filteredPlugins.map(plugin => (
          <PluginManagementCard
            key={plugin.id}
            plugin={plugin}
            hospitalId={defaultHospitalId}
            onUpdate={() => fetchPlugins()}
          />
        ))}
      </div>

      {/* Configuration dialog */}
      {selectedPlugin && (
        <PluginConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          plugin={selectedPlugin}
          hospitalId={defaultHospitalId}
          settings={selectedPlugin.settings || {}}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}
