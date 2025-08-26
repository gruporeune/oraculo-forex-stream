import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'pt' | 'en' | 'es';

interface I18nState {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const translations = {
  pt: {
    // Navigation
    'nav.home': 'Início',
    'nav.plans': 'Planos',
    'nav.dashboard': 'Dashboard',
    'nav.signals': 'Sinais',
    'nav.materials': 'Materiais',
    'nav.network': 'Rede',
    'nav.profile': 'Perfil',
    'nav.withdrawal': 'Saque',
    'nav.admin': 'Admin',
    'nav.logout': 'Sair',

    // Plans
    'plans.title': 'Escolha Seu Plano',
    'plans.subtitle': 'Cada plano foi desenvolvido para maximizar seus lucros no mercado de opções binárias com nossa IA avançada.',
    'plans.important': 'IMPORTANTE',
    'plans.important.text': 'Você pode adquirir até 5 contas por plano, sendo necessário comprar uma por vez. Após a confirmação do pagamento, você poderá adquirir contas adicionais do mesmo plano.',
    'plans.popular': 'MAIS POPULAR',
    'plans.subscribe': 'ASSINAR AGORA',
    'plans.payment.single': 'Pagamento único • Acesso imediato',
    
    // Plan descriptions
    'plan.partner.description': 'Para resultados consistentes',
    'plan.master.description': 'O plano dos profissionais',
    'plan.premium.description': 'Para traders de alto volume',
    'plan.platinum.description': 'O máximo em trading automatizado',

    // Plan features
    'feature.signals.day': 'sinais por dia',
    'feature.profit.daily': 'lucro diário até 200%',
    'feature.members.area': 'Área de membros',
    'feature.support.basic': 'Suporte básico',
    'feature.support.priority': 'Suporte prioritário',
    'feature.support.24_7': 'Suporte 24/7',
    'feature.support.vip': 'Suporte VIP 24/7',
    'feature.market.analysis': 'Análises de mercado',
    'feature.risk.management': 'Gestão de risco',
    'feature.technical.analysis': 'Análises técnicas avançadas',
    'feature.webinars': 'Webinars exclusivos',
    'feature.reports': 'Relatórios personalizados',
    'feature.telegram.vip': 'Grupo VIP Telegram',
    'feature.consultation': 'Consultoria 1:1',
    'feature.strategies': 'Estratégias personalizadas',
    'feature.early.access': 'Acesso antecipado a novos recursos',
    'feature.dedicated.analyst': 'Analista pessoal dedicado',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Bem-vindo ao ORÁCULO!',
    'dashboard.subtitle': 'Sua jornada para operar com inteligência artificial começa aqui.',
    'dashboard.your.plans': 'SEUS PLANOS',
    'dashboard.your.signals': 'SEUS SINAIS',
    'dashboard.daily.earnings': 'GANHO DO DIA',
    'dashboard.today.commissions': 'COMISSÕES HOJE',
    'dashboard.available.balance': 'SALDO DISPONÍVEL',
    'dashboard.signals.per.day': 'sinais/dia',
    'dashboard.available.today': 'Disponíveis hoje',
    'dashboard.daily.profitability': 'Rentabilidade diária',
    'dashboard.today.referrals': 'Indicações do dia',
    'dashboard.withdraw': 'Sacar',
    'dashboard.brokers.title': 'Corretoras oficiais com mais de 93% de precisão',
    'dashboard.brokers.subtitle': 'Faça seu cadastro nas corretoras recomendadas pelo ORÁCULO',
    'dashboard.bulltec.official': 'Corretora oficial',
    'dashboard.exnova.premium': 'Trading premium',
    'dashboard.whatsapp.vip': 'Grupo VIP',
    'dashboard.video.title': 'Veja o ORÁCULO em Ação',
    'dashboard.video.subtitle': 'Assista como nossa IA gera sinais vencedores',

    // Signals
    'signals.title': 'Gerador de Sinais',
    'signals.subtitle': 'Gere sinais para opções binárias com alta precisão',
    'signals.generate.new': 'Gerar Novo Sinal',
    'signals.remaining': 'Sinais restantes',
    'signals.market.type': 'Tipo de Mercado',
    'signals.select.market': 'Selecione o tipo de mercado',
    'signals.market.real': 'Mercado Real',
    'signals.market.otc': 'Mercado OTC',
    'signals.financial.asset': 'Ativo Financeiro',
    'signals.select.pair': 'Selecione o par de moedas',
    'signals.first.select.market': 'Primeiro selecione o tipo de mercado',
    'signals.expiration.time': 'Tempo de Expiração',
    'signals.select.expiration': 'Selecione o tempo de expiração',
    'signals.1.minute': '1 Minuto',
    'signals.5.minutes': '5 Minutos',
    'signals.15.minutes': '15 Minutos',
    'signals.generating': 'Gerando Sinal...',
    'signals.daily.limit': 'Limite diário atingido',
    'signals.generate': 'Gerar Sinal',
    'signals.upgrade.plan': 'Upgrade seu plano para gerar mais sinais por dia',
    'signals.statistics': 'Estatísticas',
    'signals.used.today': 'Sinais Usados Hoje',
    'signals.remaining.today': 'Sinais Restantes',
    'signals.total.available': 'Total Disponível',
    'signals.success.rate': 'Taxa de Sucesso',
    'signals.recent': 'Sinais Recentes',
    'signals.no.recent': 'Nenhum sinal gerado ainda',
    'signals.generated.success': 'Sinal gerado com sucesso!',
    'signals.confidence': 'Confiança',

    // Buttons
    'button.back': 'Voltar',
    'button.continue': 'Continuar',
    'button.cancel': 'Cancelar',
    'button.confirm': 'Confirmar',
    'button.save': 'Salvar',
    'button.edit': 'Editar',
    'button.delete': 'Excluir',

    // Payment
    'payment.method.title': 'Escolha o método de pagamento',
    'payment.method.pix': 'PIX',
    'payment.method.usdt': 'USDT (TRC20)',
    'payment.processing': 'Processando pagamento...',
    'payment.success': 'Pagamento realizado com sucesso!',
    'payment.failed': 'Falha no pagamento',

    // Common
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.warning': 'Aviso',
    'common.info': 'Informação',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.plans': 'Plans',
    'nav.dashboard': 'Dashboard',
    'nav.signals': 'Signals',
    'nav.materials': 'Materials',
    'nav.network': 'Network',
    'nav.profile': 'Profile',
    'nav.withdrawal': 'Withdrawal',
    'nav.admin': 'Admin',
    'nav.logout': 'Logout',

    // Plans
    'plans.title': 'Choose Your Plan',
    'plans.subtitle': 'Each plan was designed to maximize your profits in the binary options market with our advanced AI.',
    'plans.important': 'IMPORTANT',
    'plans.important.text': 'You can purchase up to 5 accounts per plan, one at a time. After payment confirmation, you can purchase additional accounts of the same plan.',
    'plans.popular': 'MOST POPULAR',
    'plans.subscribe': 'SUBSCRIBE NOW',
    'plans.payment.single': 'One-time payment • Immediate access',
    
    // Plan descriptions
    'plan.partner.description': 'For consistent results',
    'plan.master.description': 'The professionals plan',
    'plan.premium.description': 'For high volume traders',
    'plan.platinum.description': 'The ultimate in automated trading',

    // Plan features
    'feature.signals.day': 'signals per day',
    'feature.profit.daily': 'daily profit up to 200%',
    'feature.members.area': 'Members area',
    'feature.support.basic': 'Basic support',
    'feature.support.priority': 'Priority support',
    'feature.support.24_7': '24/7 support',
    'feature.support.vip': '24/7 VIP support',
    'feature.market.analysis': 'Market analysis',
    'feature.risk.management': 'Risk management',
    'feature.technical.analysis': 'Advanced technical analysis',
    'feature.webinars': 'Exclusive webinars',
    'feature.reports': 'Personalized reports',
    'feature.telegram.vip': 'VIP Telegram group',
    'feature.consultation': '1:1 consultation',
    'feature.strategies': 'Personalized strategies',
    'feature.early.access': 'Early access to new features',
    'feature.dedicated.analyst': 'Dedicated personal analyst',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome to ORÁCULO!',
    'dashboard.subtitle': 'Your journey to trade with artificial intelligence starts here.',
    'dashboard.your.plans': 'YOUR PLANS',
    'dashboard.your.signals': 'YOUR SIGNALS',
    'dashboard.daily.earnings': 'DAILY EARNINGS',
    'dashboard.today.commissions': 'TODAY\'S COMMISSIONS',
    'dashboard.available.balance': 'AVAILABLE BALANCE',
    'dashboard.signals.per.day': 'signals/day',
    'dashboard.available.today': 'Available today',
    'dashboard.daily.profitability': 'Daily profitability',
    'dashboard.today.referrals': 'Today\'s referrals',
    'dashboard.withdraw': 'Withdraw',
    'dashboard.brokers.title': 'Official brokers with over 93% accuracy',
    'dashboard.brokers.subtitle': 'Register with brokers recommended by ORÁCULO',
    'dashboard.bulltec.official': 'Official broker',
    'dashboard.exnova.premium': 'Premium trading',
    'dashboard.whatsapp.vip': 'VIP Group',
    'dashboard.video.title': 'See ORÁCULO in Action',
    'dashboard.video.subtitle': 'Watch how our AI generates winning signals',

    // Signals
    'signals.title': 'Signal Generator',
    'signals.subtitle': 'Generate signals for binary options with high precision',
    'signals.generate.new': 'Generate New Signal',
    'signals.remaining': 'Remaining signals',
    'signals.market.type': 'Market Type',
    'signals.select.market': 'Select market type',
    'signals.market.real': 'Real Market',
    'signals.market.otc': 'OTC Market',
    'signals.financial.asset': 'Financial Asset',
    'signals.select.pair': 'Select currency pair',
    'signals.first.select.market': 'First select market type',
    'signals.expiration.time': 'Expiration Time',
    'signals.select.expiration': 'Select expiration time',
    'signals.1.minute': '1 Minute',
    'signals.5.minutes': '5 Minutes',
    'signals.15.minutes': '15 Minutes',
    'signals.generating': 'Generating Signal...',
    'signals.daily.limit': 'Daily limit reached',
    'signals.generate': 'Generate Signal',
    'signals.upgrade.plan': 'Upgrade your plan to generate more signals per day',
    'signals.statistics': 'Statistics',
    'signals.used.today': 'Signals Used Today',
    'signals.remaining.today': 'Remaining Signals',
    'signals.total.available': 'Total Available',
    'signals.success.rate': 'Success Rate',
    'signals.recent': 'Recent Signals',
    'signals.no.recent': 'No signals generated yet',
    'signals.generated.success': 'Signal generated successfully!',
    'signals.confidence': 'Confidence',

    // Buttons
    'button.back': 'Back',
    'button.continue': 'Continue',
    'button.cancel': 'Cancel',
    'button.confirm': 'Confirm',
    'button.save': 'Save',
    'button.edit': 'Edit',
    'button.delete': 'Delete',

    // Payment
    'payment.method.title': 'Choose payment method',
    'payment.method.pix': 'PIX',
    'payment.method.usdt': 'USDT (TRC20)',
    'payment.processing': 'Processing payment...',
    'payment.success': 'Payment successful!',
    'payment.failed': 'Payment failed',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.warning': 'Warning',
    'common.info': 'Information',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.plans': 'Planes',
    'nav.dashboard': 'Panel',
    'nav.signals': 'Señales',
    'nav.materials': 'Materiales',
    'nav.network': 'Red',
    'nav.profile': 'Perfil',
    'nav.withdrawal': 'Retiro',
    'nav.admin': 'Admin',
    'nav.logout': 'Salir',

    // Plans
    'plans.title': 'Elige Tu Plan',
    'plans.subtitle': 'Cada plan fue diseñado para maximizar tus ganancias en el mercado de opciones binarias con nuestra IA avanzada.',
    'plans.important': 'IMPORTANTE',
    'plans.important.text': 'Puedes comprar hasta 5 cuentas por plan, una a la vez. Después de la confirmación del pago, podrás comprar cuentas adicionales del mismo plan.',
    'plans.popular': 'MÁS POPULAR',
    'plans.subscribe': 'SUSCRIBIRSE AHORA',
    'plans.payment.single': 'Pago único • Acceso inmediato',
    
    // Plan descriptions
    'plan.partner.description': 'Para resultados consistentes',
    'plan.master.description': 'El plan de los profesionales',
    'plan.premium.description': 'Para traders de alto volumen',
    'plan.platinum.description': 'Lo máximo en trading automatizado',

    // Plan features
    'feature.signals.day': 'señales por día',
    'feature.profit.daily': 'ganancia diaria hasta 200%',
    'feature.members.area': 'Área de miembros',
    'feature.support.basic': 'Soporte básico',
    'feature.support.priority': 'Soporte prioritario',
    'feature.support.24_7': 'Soporte 24/7',
    'feature.support.vip': 'Soporte VIP 24/7',
    'feature.market.analysis': 'Análisis de mercado',
    'feature.risk.management': 'Gestión de riesgo',
    'feature.technical.analysis': 'Análisis técnico avanzado',
    'feature.webinars': 'Webinars exclusivos',
    'feature.reports': 'Reportes personalizados',
    'feature.telegram.vip': 'Grupo VIP Telegram',
    'feature.consultation': 'Consultoría 1:1',
    'feature.strategies': 'Estrategias personalizadas',
    'feature.early.access': 'Acceso anticipado a nuevas funciones',
    'feature.dedicated.analyst': 'Analista personal dedicado',

    // Dashboard
    'dashboard.title': 'Panel',
    'dashboard.welcome': '¡Bienvenido a ORÁCULO!',
    'dashboard.subtitle': 'Tu viaje para operar con inteligencia artificial comienza aquí.',
    'dashboard.your.plans': 'TUS PLANES',
    'dashboard.your.signals': 'TUS SEÑALES',
    'dashboard.daily.earnings': 'GANANCIAS DEL DÍA',
    'dashboard.today.commissions': 'COMISIONES HOY',
    'dashboard.available.balance': 'SALDO DISPONIBLE',
    'dashboard.signals.per.day': 'señales/día',
    'dashboard.available.today': 'Disponibles hoy',
    'dashboard.daily.profitability': 'Rentabilidad diaria',
    'dashboard.today.referrals': 'Referencias de hoy',
    'dashboard.withdraw': 'Retirar',
    'dashboard.brokers.title': 'Brokers oficiales con más del 93% de precisión',
    'dashboard.brokers.subtitle': 'Regístrate en los brokers recomendados por ORÁCULO',
    'dashboard.bulltec.official': 'Broker oficial',
    'dashboard.exnova.premium': 'Trading premium',
    'dashboard.whatsapp.vip': 'Grupo VIP',
    'dashboard.video.title': 'Mira ORÁCULO en Acción',
    'dashboard.video.subtitle': 'Ve cómo nuestra IA genera señales ganadoras',

    // Signals
    'signals.title': 'Generador de Señales',
    'signals.subtitle': 'Genera señales para opciones binarias con alta precisión',
    'signals.generate.new': 'Generar Nueva Señal',
    'signals.remaining': 'Señales restantes',
    'signals.market.type': 'Tipo de Mercado',
    'signals.select.market': 'Selecciona tipo de mercado',
    'signals.market.real': 'Mercado Real',
    'signals.market.otc': 'Mercado OTC',
    'signals.financial.asset': 'Activo Financiero',
    'signals.select.pair': 'Selecciona par de divisas',
    'signals.first.select.market': 'Primero selecciona el tipo de mercado',
    'signals.expiration.time': 'Tiempo de Expiración',
    'signals.select.expiration': 'Selecciona tiempo de expiración',
    'signals.1.minute': '1 Minuto',
    'signals.5.minutes': '5 Minutos',
    'signals.15.minutes': '15 Minutos',
    'signals.generating': 'Generando Señal...',
    'signals.daily.limit': 'Límite diario alcanzado',
    'signals.generate': 'Generar Señal',
    'signals.upgrade.plan': 'Mejora tu plan para generar más señales por día',
    'signals.statistics': 'Estadísticas',
    'signals.used.today': 'Señales Usadas Hoy',
    'signals.remaining.today': 'Señales Restantes',
    'signals.total.available': 'Total Disponible',
    'signals.success.rate': 'Tasa de Éxito',
    'signals.recent': 'Señales Recientes',
    'signals.no.recent': 'Aún no se han generado señales',
    'signals.generated.success': '¡Señal generada exitosamente!',
    'signals.confidence': 'Confianza',

    // Buttons
    'button.back': 'Volver',
    'button.continue': 'Continuar',
    'button.cancel': 'Cancelar',
    'button.confirm': 'Confirmar',
    'button.save': 'Guardar',
    'button.edit': 'Editar',
    'button.delete': 'Eliminar',

    // Payment
    'payment.method.title': 'Elige el método de pago',
    'payment.method.pix': 'PIX',
    'payment.method.usdt': 'USDT (TRC20)',
    'payment.processing': 'Procesando pago...',
    'payment.success': '¡Pago exitoso!',
    'payment.failed': 'Pago fallido',

    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.warning': 'Advertencia',
    'common.info': 'Información',
  },
};

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'pt',
      setLanguage: (language: Language) => set({ language }),
      t: (key: string): string => {
        const { language } = get();
        return translations[language][key as keyof typeof translations.pt] || key;
      },
    }),
    {
      name: 'i18n-storage',
    }
  )
);

export const getAvailableLanguages = () => [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];