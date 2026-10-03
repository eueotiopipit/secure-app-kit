import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Camera, Check, KeyRound, LogOut, Mail, Save, ShieldCheck, User, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FinanceLayout } from "@/components/finance-layout";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — Plano Anti-Dívidas" },
      { name: "description", content: "Personalize seu perfil e gerencie sua conta." },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newEmail, setNewEmail] = useState(user.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name,avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;
      if (error) {
        toast.error("Não foi possível carregar seu perfil.");
      } else {
        setDisplayName(data?.display_name ?? user.user_metadata?.display_name ?? "");
        setAvatarUrl(data?.avatar_url ?? "");
      }
      setLoadingProfile(false);
    }
    loadProfile();
    return () => { active = false; };
  }, [user.id, user.user_metadata?.display_name]);

  const initials = useMemo(() => {
    const name = displayName.trim() || "Usuário";
    return name.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("");
  }, [displayName]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName) {
      toast.error("Digite seu nome.");
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          display_name: cleanName,
          avatar_url: avatarUrl.trim() || null,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { display_name: cleanName },
      });
      if (metadataError) throw metadataError;

      toast.success("Perfil atualizado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar seu perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveSecurity(e: React.FormEvent) {
    e.preventDefault();
    setSavingSecurity(true);
    try {
      if (newPassword || confirmPassword) {
        if (newPassword.length < 6) throw new Error("A nova senha precisa ter pelo menos 6 caracteres.");
        if (newPassword !== confirmPassword) throw new Error("As senhas não coincidem.");

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Senha alterada com sucesso.");
      }

      if (newEmail.trim() && newEmail.trim() !== (user.email ?? "")) {
        const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
        if (error) throw error;
        toast.success("Enviamos uma confirmação para o novo email.");
      }

      if (!newPassword && !confirmPassword && newEmail.trim() === (user.email ?? "")) {
        toast("Nenhuma alteração de segurança para salvar.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar sua conta.");
    } finally {
      setSavingSecurity(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Não foi possível sair da conta.");
      setLoggingOut(false);
      return;
    }
    navigate({ to: "/auth", replace: true });
  }

  return (
    <FinanceLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Sua conta</p>
          <h1 className="text-3xl font-bold tracking-tight">Meu perfil</h1>
          <p className="mt-1 text-muted-foreground">Personalize seus dados e mantenha sua conta protegida.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="size-5" />Dados pessoais</CardTitle>
            <CardDescription>Essas informações aparecem dentro do seu aplicativo.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-xl font-bold">
                  {avatarUrl.trim() ? (
                    <img src={avatarUrl.trim()} alt="Foto do perfil" className="size-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="avatar">Foto do perfil</Label>
                  <div className="relative">
                    <Camera className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="avatar" type="url" placeholder="https://..." className="pl-9" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
                  </div>
                  <p className="text-xs text-muted-foreground">Cole o link de uma imagem pública. Se deixar vazio, usamos suas iniciais.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display-name">Nome</Label>
                <Input id="display-name" placeholder="Como você quer ser chamado?" value={displayName} onChange={e => setDisplayName(e.target.value)} disabled={loadingProfile} maxLength={80} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-email">Email da conta</Label>
                <Input id="profile-email" value={user.email ?? ""} disabled />
                <p className="text-xs text-muted-foreground">Para trocar o email, use a seção de segurança abaixo.</p>
              </div>

              <Button type="submit" disabled={loadingProfile || savingProfile}>
                <Save className="size-4" />
                {savingProfile ? "Salvando..." : "Salvar perfil"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />Segurança da conta</CardTitle>
            <CardDescription>Altere seu email ou crie uma nova senha.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveSecurity} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-email">Novo email</Label>
                <Input id="new-email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="novo@email.com" />
                <p className="text-xs text-muted-foreground">O Supabase pode pedir confirmação no novo endereço.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="new-password" type="password" className="pl-9" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" minLength={6} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar senha</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" minLength={6} />
                </div>
              </div>

              <Button type="submit" variant="outline" disabled={savingSecurity}>
                <Check className="size-4" />
                {savingSecurity ? "Atualizando..." : "Atualizar segurança"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive"><LogOut className="size-5" />Sair da conta</CardTitle>
            <CardDescription>Encerra a sessão neste dispositivo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={logout} disabled={loggingOut}>
              <LogOut className="size-4" />
              {loggingOut ? "Saindo..." : "Sair da conta"}
            </Button>
          </CardContent>
        </Card>

        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="size-3.5" />Sua senha nunca é armazenada pelo aplicativo.</p>
      </div>
    </FinanceLayout>
  );
}
