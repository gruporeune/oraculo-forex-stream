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