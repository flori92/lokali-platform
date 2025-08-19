import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, User, Mail, Phone, Shield, LogOut, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

const Profile = () => {
  const { user, updateProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateProfile(formData);
      setSuccess('Profil mis à jour avec succès');
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || ''
    });
    setEditing(false);
    setError('');
    setSuccess('');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      setError('Erreur lors de la déconnexion');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Propriétaire';
      case 'admin':
        return 'Administrateur';
      default:
        return 'Locataire';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-gray-600">Chargement du profil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* En-tête du profil */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-lg">
                    {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <CardTitle className="text-2xl">{user.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                  {user.verified ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Shield className="h-3 w-3 mr-1" />
                      Vérifié
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      En attente de vérification
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Informations du profil */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations personnelles
                  </CardTitle>
                  <CardDescription>
                    Gérez vos informations de profil
                  </CardDescription>
                </div>
                
                {!editing && (
                  <Button
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    Modifier
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {(success || error) && (
                <Alert variant={success ? "default" : "destructive"}>
                  <AlertDescription>
                    {success || error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  {editing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={loading}
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-md">{user.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  {editing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={loading}
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-md flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {user.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="px-3 py-2 bg-gray-50 rounded-md text-gray-600">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    L'email ne peut pas être modifié
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <p className="px-3 py-2 bg-gray-50 rounded-md text-gray-600">
                    {getRoleLabel(user.role)}
                  </p>
                </div>
              </div>

              {editing && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions du compte */}
          <Card>
            <CardHeader>
              <CardTitle>Actions du compte</CardTitle>
              <CardDescription>
                Gérez votre compte et vos préférences
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Déconnexion</h4>
                  <p className="text-sm text-gray-600">
                    Se déconnecter de votre compte
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
