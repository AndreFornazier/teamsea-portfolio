/* ==========================================================================
   team sea — CONFIGURAÇÃO GERAL
   Edite este arquivo para trocar contatos, ferramentas, textos e o envio
   do formulário. Não é preciso mexer no HTML.
   ========================================================================== */
window.TEAM_SEA_CONFIG = {
  brand: "team sea",
  role: "Creative Video Editor & Motion Designer",

  /* Quando true, aparece um selo discreto de "conteúdo demonstrativo".
     Mude para false quando os projetos reais estiverem cadastrados. */
  demoMode: false,

  /* Cursor personalizado (somente em desktop com mouse). */
  customCursor: true,

  contact: {
    /* Somente números, com DDI + DDD. Ex.: "5562999998888".
       Enquanto estiver vazio, o botão do WhatsApp fica oculto. */
    whatsappNumber: "5562999937694",
    whatsappMessage: "Olá! Vi o portfólio da team sea e gostaria de conversar sobre um projeto.",

    /* Deixe vazio ("") para ocultar o item. */
    email: "andre.fornazier424@gmail.com",
    instagram: "", // apenas o @, sem a arroba. Ex.: "team sea.studio"
    linkedin: "",  // URL completa. Ex.: "https://www.linkedin.com/in/seu-perfil"
  },

  /* Envio do formulário — integração real.
     provider:
       "formsubmit" → envia para o e-mail informado em `formsubmitEmail`
                      via https://formsubmit.co (sem cadastro; o primeiro envio
                      dispara um e-mail de ativação que precisa ser confirmado).
       "formspree"  → informe a URL do seu formulário em `endpoint`
                      (ex.: "https://formspree.io/f/abcdwxyz").
       "custom"     → qualquer endpoint que aceite POST JSON e responda 2xx.
     Enquanto não estiver configurado, o formulário avisa o visitante e oferece
     os outros canais — ele nunca finge que a mensagem foi enviada. */
  form: {
    provider: "formsubmit",
    formsubmitEmail: "",
    endpoint: "",
    subject: "Novo contato pelo portfólio team sea",
  },

  /* Ferramentas exibidas na seção "Ferramentas".
     `abbr` é o texto do selo; `note` é uma frase curta opcional sobre o uso.
     Adicione, remova ou reordene livremente. Não há níveis de proficiência. */
  tools: [
    { name: "Adobe Premiere Pro", abbr: "Pr", note: "Edição, montagem e finalização de vídeo" },
    { name: "Adobe After Effects", abbr: "Ae", note: "Motion graphics, composição e efeitos" },
    { name: "Adobe Photoshop", abbr: "Ps", note: "Design gráfico, tratamento e artes para redes" },
    { name: "Blender", abbr: "Bl", note: "Modelagem, animação e render 3D" },
    { name: "Unity", abbr: "Un", note: "Cenas interativas e tempo real" },
  ],

  /* Habilidades em formato de etiquetas (seção Ferramentas). */
  skills: [
    "Edição de vídeo", "Motion design", "Animação 2D", "Animação 3D", "Tipografia animada",
    "Color grading", "Sound design", "Tracking", "Legendas dinâmicas", "Design para redes sociais",
    "Identidade visual", "Direção de arte",
  ],

  /* Tipos de projeto do formulário de contato. */
  projectTypes: [
    "Animação / Motion design", "Vídeo horizontal", "Reels", "Posts para redes sociais",
    "Branding / Identidade visual", "Outro",
  ],

  /* Quantos projetos mostrar antes do botão "Carregar mais". */
  pageSize: 8,
};
