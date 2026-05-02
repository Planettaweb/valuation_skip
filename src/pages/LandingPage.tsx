import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Zap,
  CheckCircle2,
  PieChart,
  BrainCircuit,
  LineChart,
  Building2,
  Users,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function LandingPage() {
  const { userProfile } = useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
              <LineChart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-300">
              Nexus M&A 2.0
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#solucao" className="hover:text-foreground transition-colors">
              Solução
            </a>
            <a href="#modulos" className="hover:text-foreground transition-colors">
              Módulos
            </a>
            <a href="#diferenciais" className="hover:text-foreground transition-colors">
              Diferenciais
            </a>
            <a href="#parceiros" className="hover:text-foreground transition-colors">
              Parceiros
            </a>
          </nav>
          <div className="flex items-center gap-4">
            {userProfile ? (
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link to="/app">
                  Ir para o App <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex hover:bg-white/5">
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link to="/register">Começar Agora</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-4 max-w-6xl relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20 animate-fade-in">
              <Zap className="w-4 h-4" />
              <span>O Copiloto Financeiro Definitivo</span>
            </div>

            <h1
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight animate-slide-up"
              style={{ animationDelay: '100ms', animationFillMode: 'both' }}
            >
              Transforme números em decisões e <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                decisões em valor
              </span>
            </h1>

            <p
              className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up"
              style={{ animationDelay: '200ms', animationFillMode: 'both' }}
            >
              Consolide dados financeiros, descubra insights acionáveis com Inteligência Artificial
              e obtenha avaliações precisas de Valuation em tempo real. A plataforma B2B construída
              para o crescimento estratégico.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up"
              style={{ animationDelay: '300ms', animationFillMode: 'both' }}
            >
              <Button
                size="lg"
                className="h-14 px-8 text-lg w-full sm:w-auto shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
                asChild
              >
                <Link to="/register">
                  Solicitar Demonstração
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg w-full sm:w-auto border-white/10 hover:bg-white/5"
                asChild
              >
                <a href="#solucao">Conhecer a Solução</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Problema vs Solução */}
        <section id="solucao" className="py-24 bg-card/30 border-b border-white/5 relative">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Avaliamos o passado para projetar o seu futuro
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Sua empresa ainda toma decisões baseada em intuição? O Nexus M&A 2.0 substitui a
                cegueira financeira por previsibilidade absoluta.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 rounded-2xl bg-destructive/5 border border-destructive/20 relative overflow-hidden group hover:bg-destructive/10 transition-colors duration-500">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                  <ShieldCheck className="w-32 h-32 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-destructive/90 mb-8 relative z-10">
                  Cegueira Financeira
                </h3>
                <ul className="space-y-5 relative z-10">
                  {[
                    'Silos de dados e fechamentos operacionais demorados',
                    'Decisões baseadas puramente em intuição e planilhas estáticas',
                    'Valuation manual, extremamente caro e sujeito a erros',
                    'Visão retrospectiva limitada, sem qualquer previsibilidade',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="mt-1 w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-destructive text-sm font-bold">X</span>
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 relative overflow-hidden group hover:bg-emerald-500/10 transition-colors duration-500">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                  <TrendingUp className="w-32 h-32 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-400 mb-8 relative z-10">
                  Inteligência Nexus
                </h3>
                <ul className="space-y-5 relative z-10">
                  {[
                    'Consolidação automatizada com DRE e Balanço em tempo real',
                    'Decisões orientadas por IA e recomendações estratégicas',
                    'Cálculo de Valuation automatizado (DCF) em poucos cliques',
                    'Projeções futuras, simulação de cenários e sensibilidade',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Níveis de Módulos */}
        <section id="modulos" className="py-24 relative border-b border-white/5">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Uma jornada de evolução para o seu negócio
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Nossa arquitetura foi desenhada para acompanhar a maturidade da sua empresa. Do
                controle financeiro básico à inteligência preditiva.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  title: 'Nível 1: Base',
                  subtitle: 'Consolidação e visibilidade',
                  icon: BarChart3,
                  features: [
                    'Upload de DRE e Balanço',
                    'Dashboard Executivo de KPIs',
                    'Status visual (Semáforo)',
                    'Histórico de 12 meses',
                  ],
                },
                {
                  title: 'Nível 2: Analítica',
                  subtitle: 'Diagnóstico profundo',
                  icon: PieChart,
                  features: [
                    'Análise Horizontal e Vertical',
                    'Indicadores Avançados (ROA/ROE)',
                    'Identificação de Anomalias',
                    'Composição percentual',
                  ],
                  popular: true,
                },
                {
                  title: 'Nível 3: Estratégica',
                  subtitle: 'Projeções e cenários',
                  icon: TrendingUp,
                  features: [
                    'Simulador de Cenários (E se?)',
                    'Construtor de Orçamento',
                    'Recomendações com IA',
                    'Análise de Risco',
                  ],
                },
                {
                  title: 'Nível 4: Premium',
                  subtitle: 'Valuation & M&A',
                  icon: Building2,
                  features: [
                    'Valuation Automatizado (DCF)',
                    'Sinergias de Aquisição (M&A)',
                    'Modelos Preditivos (Churn)',
                    'Dados Macroeconômicos',
                  ],
                },
              ].map((tier, i) => (
                <div
                  key={i}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 ${tier.popular ? 'bg-primary/5 border-primary/40 shadow-[0_0_30px_-5px_rgba(var(--primary),0.2)] -translate-y-2' : 'bg-card/40 border-white/5 hover:border-white/20'} flex flex-col h-full`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full whitespace-nowrap shadow-lg">
                      O Mais Recomendado
                    </div>
                  )}
                  <tier.icon
                    className={`w-10 h-10 mb-4 ${tier.popular ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <h3 className="text-xl font-bold mb-1">{tier.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6 h-10">{tier.subtitle}</p>
                  <ul className="space-y-3 flex-1 mb-8">
                    {tier.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-foreground/80">
                        <CheckCircle2
                          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tier.popular ? 'text-primary' : 'text-muted-foreground'}`}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={tier.popular ? 'default' : 'outline'}
                    className={`w-full mt-auto ${!tier.popular && 'border-white/10'}`}
                    asChild
                  >
                    <Link to="/register">Iniciar com {tier.title.split(':')[1].trim()}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Diferenciais Competitivos */}
        <section id="diferenciais" className="py-24 bg-primary/5 border-b border-white/5">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
                  <BrainCircuit className="w-4 h-4" />
                  <span>Diferencial Exclusivo</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Copiloto Inteligente e Valuation sob Demanda
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Diferente de ERPs tradicionais ou planilhas estáticas, o Nexus utiliza
                  Inteligência Artificial para dialogar com seus dados financeiros. Você foca na
                  estratégia, o sistema automatiza o cálculo.
                </p>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                      <LineChart className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1">Valuation DCF Automatizado</h4>
                      <p className="text-muted-foreground text-sm">
                        Elimine consultorias demoradas. Calcule o valor real da sua empresa a
                        qualquer momento, integrado diretamente com seus últimos fechamentos
                        contábeis.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1">Simulação de Cenários (What-If)</h4>
                      <p className="text-muted-foreground text-sm">
                        Crie projeções interativas. Descubra imediatamente qual o impacto de
                        aumentar preços, reduzir custos ou realizar um novo investimento.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative order-1 md:order-2">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-purple-600/30 rounded-2xl blur-[80px]" />
                <div className="relative glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl bg-card/60 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                    <span className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-primary" />
                      Chat Nexus IA
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Online</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl rounded-tr-sm p-4 w-[85%] text-sm shadow-sm">
                      Por que nossa margem líquida caiu neste trimestre, e qual o impacto no
                      Valuation?
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-xl rounded-tl-sm p-5 w-[90%] ml-auto text-sm shadow-sm">
                      <p className="mb-3 leading-relaxed">
                        A margem líquida recuou{' '}
                        <span className="font-bold text-destructive">2.4%</span> primariamente
                        devido a:
                      </p>
                      <ul className="list-disc pl-5 space-y-2 text-muted-foreground mb-4">
                        <li>Aumento de 18% no CAC (Custo de Aquisição de Clientes).</li>
                        <li>
                          Expansão não provisionada na linha de despesas operacionais
                          (Infraestrutura Cloud).
                        </li>
                      </ul>
                      <div className="bg-background/50 rounded p-3 border border-white/5 mb-3">
                        <p className="font-medium text-foreground mb-1">Impacto Estimado no DCF:</p>
                        <p className="text-destructive font-mono">- R$ 1.2M no valor terminal</p>
                      </div>
                      <p className="mt-2 text-primary font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Recomendação: Revisar contratos de
                        infraestrutura e readequar budget de marketing Q4.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Parceiros / White-label */}
        <section id="parceiros" className="py-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
          <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-8 border border-white/10">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Programa de Parceiros Especialistas
            </h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Você é{' '}
              <span className="text-foreground font-medium">
                contador focado em gestão, consultor financeiro ou assessor de M&A
              </span>
              ? Utilize o Nexus M&A 2.0 como ferramenta{' '}
              <span className="text-foreground font-medium">white-label</span> para agregar um valor
              extraordinário às suas entregas, fidelizar clientes e escalar sua própria receita.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-14 px-10 text-lg w-full sm:w-auto" asChild>
                <a href="mailto:parceiros@nexusma.com">Quero ser Parceiro Oficial</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-card/80">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                <LineChart className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold tracking-tight">Nexus M&A 2.0</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground font-medium">
              <a href="#solucao" className="hover:text-foreground transition-colors">
                Solução
              </a>
              <a href="#modulos" className="hover:text-foreground transition-colors">
                Preços
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Privacidade
              </a>
            </div>
          </div>
          <div className="text-center md:text-left text-sm text-muted-foreground/60 border-t border-white/5 pt-8">
            <p>
              © {new Date().getFullYear()} Átiman / Nexus M&A. Todos os direitos reservados.
              Transformando finanças corporativas.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
