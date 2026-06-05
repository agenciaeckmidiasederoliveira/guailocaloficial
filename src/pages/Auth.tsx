import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, Crown } from "lucide-react";
import { z } from "zod";
import { PasswordStrengthIndicator, validatePassword } from "@/components/PasswordStrengthIndicator";
import logotipo from "@/assets/logotipo.png";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Digite sua senha"),
});

const signupSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Deve conter letra maiúscula")
    .regex(/[a-z]/, "Deve conter letra minúscula")
    .regex(/[0-9]/, "Deve conter número")
    .regex(/[^A-Za-z0-9]/, "Deve conter símbolo especial"),
});

export default function Auth() {
  const { signIn, signUp, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conviteToken = searchParams.get("convite") || localStorage.getItem("convite_token");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState(conviteToken ? "signup" : "login");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Persist convite token so it survives email confirmation redirect
  useEffect(() => {
    const urlToken = searchParams.get("convite");
    if (urlToken) {
      localStorage.setItem("convite_token", urlToken);
    }
  }, [searchParams]);

  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "E-mail enviado!", description: "Verifique sua caixa de entrada para redefinir sua senha." });
        setShowForgot(false);
        setForgotEmail("");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  // Redirect if already logged in, claim invite if needed
  useEffect(() => {
    if (user) {
      if (conviteToken) {
        supabase.rpc("claim_parceiro_invite", { p_token: conviteToken }).then(async ({ data }) => {
          localStorage.removeItem("convite_token");
          if (data) {
            await refreshProfile();
            toast({ title: "Bem-vindo, Parceiro!", description: "Seu acesso de parceiro foi ativado." });
            navigate("/parceiro");
          } else {
            navigate("/");
          }
        });
      } else {
        navigate("/");
      }
    }
  }, [user, navigate, conviteToken, refreshProfile]);

  if (user) return null;

  const handleAuth = async (type: "login" | "signup") => {
    const schema = type === "login" ? loginSchema : signupSchema;
    const validation = schema.safeParse({ email, password });
    
    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    // Additional validation for signup
    if (type === "signup") {
      const { valid, errors } = validatePassword(password);
      if (!valid) {
        toast({
          title: "Senha fraca",
          description: errors[0],
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = type === "login" 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        let message = error.message;
        if (error.message.includes("Invalid login")) {
          message = "E-mail ou senha incorretos";
        } else if (error.message.includes("already registered")) {
          message = "Este e-mail já está cadastrado";
        } else if (error.message.includes("Email not confirmed")) {
          message = "Sua conta ainda não está liberada. Tente novamente em instantes.";
        }
        toast({
          title: "Erro",
          description: message,
          variant: "destructive",
        });
      } else if (type === "signup") {
        toast({
          title: "Cadastro realizado!",
          description: "Sua conta foi criada com sucesso. Agora você já pode entrar.",
        });
        setActiveTab("login");
        setPassword("");
      } else if (type === "login") {
        if (!conviteToken) {
          toast({
            title: "Bem-vindo!",
            description: "Login efetuado com sucesso",
          });
          navigate("/");
        }
        // If conviteToken exists, the useEffect will handle claim + redirect
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-secondary/60 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        {conviteToken && (
          <div className="flex items-center gap-2 rounded-t-lg bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
            <Crown className="h-5 w-5 text-amber-500" />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Você foi convidado como Parceiro! Crie sua conta para ativar.
            </p>
          </div>
        )}
        <CardHeader className="text-center">
          <img
            src={logotipo}
            alt="Guia Local BR"
            className="mx-auto mb-4 h-16 w-auto"
          />
          <CardTitle className="font-display text-2xl">Guia Local BR</CardTitle>
          <CardDescription>
            {conviteToken ? "Crie sua conta para acessar a área de parceiro" : "Acesse sua conta ou crie uma nova"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="off"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <Button 
                className="w-full h-11 touch-target" 
                onClick={() => handleAuth("login")}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-primary/30 text-primary font-semibold hover:bg-primary/5"
                onClick={() => setShowForgot(true)}
              >
                <Lock className="mr-2 h-4 w-4" />
                Esqueci minha senha
              </Button>

              {/* Forgot Password Modal */}
              {showForgot && (
                <div className="mt-4 p-4 border border-border rounded-lg bg-muted/30 space-y-3">
                  <p className="text-sm text-muted-foreground">Digite seu e-mail para receber o link de redefinição:</p>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    className="h-11"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={forgotLoading || !forgotEmail}
                      onClick={handleForgotPassword}
                    >
                      {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enviar Link
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowForgot(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="signup" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="off"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Senha forte"
                    className="pl-10 h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <PasswordStrengthIndicator password={password} />
              </div>
              <Button 
                className="w-full h-11 touch-target" 
                onClick={() => handleAuth("signup")}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Conta
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
