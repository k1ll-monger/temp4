import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

const UserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [bio, setBio] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const getCurrentUser = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw sessionError;
    }

    if (!session?.user) {
      console.log('No active session, redirecting to login');
      navigate('/login');
      return null;
    }

    return session.user;
  };

  const fetchProfile = async () => {
    try {
      console.log('Starting profile fetch...');
      const user = await getCurrentUser();
      if (!user) return;

      console.log('Current user:', user);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }

      console.log('Fetched profile data:', profileData);

      if (!profileData) {
        console.log('No profile found, creating new profile...');
        // Create new profile
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              username: user.user_metadata.username || user.email?.split('@')[0] || 'User',
              email: user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Profile creation error:', createError);
          throw createError;
        }

        console.log('Created new profile:', newProfile);
        setProfile(newProfile);
        setBio(newProfile.bio || '');
      } else {
        setProfile(profileData);
        setBio(profileData.bio || '');
      }
    } catch (error: any) {
      console.error('Error in fetchProfile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      
      if (!file) return;

      const user = await getCurrentUser();
      if (!user) return;

      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleBioUpdate = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ 
          bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? { ...prev, bio } : null);

      toast({
        title: "Success",
        description: "Bio updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating bio:', error);
      toast({
        title: "Error",
        description: "Failed to update bio",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-background py-12">
      <div className="w-full max-w-2xl px-4">
        <div className="border-border bg-card p-6 rounded-lg shadow-md space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold">{profile.username}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <Label htmlFor="avatar" className="cursor-pointer">
                <Button className="bg-transparent hover:bg-transparent border border-input hover:border-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Change Profile Picture'}
                </Button>
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <div className="flex gap-2">
                <Input
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="flex-1"
                />
                <Button onClick={handleBioUpdate}>Save</Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Member since: {new Date(profile.created_at).toLocaleDateString()}</p>
              <p>Last updated: {new Date(profile.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 