import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, Upload, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfilePageProps {
  user: any;
  profile: any;
  onProfileUpdate: () => void;
}

export default function ProfilePage({ user, profile, onProfileUpdate }: ProfilePageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      toast({
        title: "Erro",
        description: "Nova senha e confirmação não coincidem",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Senha atualizada com sucesso"
      });
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onProfileUpdate();
      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Perfil</h2>
        <p className="text-white/70">Gerencie suas informações pessoais</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações Pessoais */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-purple-600 text-white text-xl">
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="border-white/20 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Alterar Foto
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-white/70">Nome Completo</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-white/40" />
                  <span className="text-white">{profile?.full_name || 'Não informado'}</span>
                </div>
              </div>

              <div>
                <Label className="text-white/70">E-mail</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-white/40" />
                  <span className="text-white">{user.email}</span>
                </div>
              </div>

              <div>
                <Label className="text-white/70">Plano Atual</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white uppercase font-medium">{profile?.plan || 'FREE'}</span>
                </div>
              </div>

              <div>
                <Label className="text-white/70">Código de Indicação</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-purple-400 font-mono">{profile?.referral_code}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(profile?.referral_code || '');
                      toast({ title: "Código copiado!" });
                    }}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alterar Senha */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5" />
              Alterar Senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label className="text-white/70">Nova Senha</Label>
                <Input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Label className="text-white/70">Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  required
                  minLength={6}
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? 'Atualizando...' : 'Alterar Senha'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}