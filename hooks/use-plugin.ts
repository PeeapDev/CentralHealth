/**
 * Plugin Hook
 * 
 * This hook provides access to plugin functionality and settings in React components.
 */

'use client';

import { useEffect, useState } from 'react';
import { useHospital } from './use-hospital';
import { useSession } from 'next-auth/react';

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  category: string;
  author: string;
  description: string;
  path: string;
}

export interface UsePluginReturn {
  plugin: PluginInfo | null;
  settings: Record<string, any>;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  hospital: {
    id: string;
    name: string;
  };
}

/**
 * Hook to access plugin data and settings
 * 
 * @param pluginName The name of the plugin
 * @returns Plugin information and settings
 */
export function usePlugin(pluginName: string): UsePluginReturn {
  const [plugin, setPlugin] = useState<PluginInfo | null>(null);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { hospital } = useHospital();
  const { data: session } = useSession();
  
  useEffect(() => {
    if (!hospital?.id || !pluginName || !session?.user) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Fetch plugin information and settings
    fetch(`/api/plugins/${encodeURIComponent(pluginName)}?hospitalId=${hospital.id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load plugin');
        }
        return response.json();
      })
      .then(data => {
        setPlugin(data.plugin);
        setSettings(data.settings || {});
        setIsActive(data.isActive || false);
      })
      .catch(err => {
        console.error('Error loading plugin:', err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [pluginName, hospital?.id, session?.user]);
  
  return {
    plugin,
    settings,
    isActive,
    isLoading,
    error,
    hospital: {
      id: hospital?.id || '',
      name: hospital?.name || '',
    }
  };
}

/**
 * Hook to access all active plugins for the current hospital
 */
export function useActivePlugins() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { hospital } = useHospital();
  const { data: session } = useSession();
  
  useEffect(() => {
    if (!hospital?.id || !session?.user) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Fetch active plugins
    fetch(`/api/plugins?hospitalId=${hospital.id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load plugins');
        }
        return response.json();
      })
      .then(data => {
        setPlugins(data.plugins || []);
      })
      .catch(err => {
        console.error('Error loading plugins:', err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [hospital?.id, session?.user]);
  
  return { plugins, isLoading, error };
}

/**
 * Hook to access plugin settings with the ability to update them
 */
export function usePluginSettings(pluginName: string) {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { hospital } = useHospital();
  const { data: session } = useSession();
  
  useEffect(() => {
    if (!hospital?.id || !pluginName || !session?.user) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Fetch plugin settings
    fetch(`/api/plugins/${encodeURIComponent(pluginName)}/settings?hospitalId=${hospital.id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load plugin settings');
        }
        return response.json();
      })
      .then(data => {
        setSettings(data.settings || {});
      })
      .catch(err => {
        console.error('Error loading plugin settings:', err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [pluginName, hospital?.id, session?.user]);
  
  const updateSettings = async (newSettings: Record<string, any>): Promise<boolean> => {
    if (!hospital?.id || !pluginName || !session?.user) {
      setError('Cannot update settings: missing hospital or session data');
      return false;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/plugins/${encodeURIComponent(pluginName)}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hospitalId: hospital.id,
          settings: newSettings,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update plugin settings');
      }
      
      const data = await response.json();
      setSettings(data.settings || {});
      
      return true;
    } catch (err) {
      console.error('Error updating plugin settings:', err);
      setError(err.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  return {
    settings,
    isLoading,
    isSaving,
    error,
    updateSettings,
  };
}
