# team sea — portfólio de audiovisual e design

Site estático (HTML5, CSS3 e JavaScript puro, sem frameworks e sem etapa de build).
Abra o `index.html` no navegador ou publique a pasta inteira em qualquer hospedagem estática.

## Estrutura

```
index.html                 página única (home, destaques, serviços, projetos, sobre, ferramentas, contato)
assets/
  css/style.css            todo o visual (tokens de cor e fonte no topo do arquivo)
  js/config.js             ← contatos, WhatsApp, formulário, ferramentas, habilidades
  js/projects.js           ← BASE DE PROJETOS e categorias (fonte única de dados)
  js/main.js               interações (galeria, filtros, modal, lightbox, formulário, animações)
  fonts/                   Syne, Manrope e JetBrains Mono (auto-hospedadas, licença OFL)
  img/                     perfil.webp, og-image.jpg, favicon.svg
  media/thumbs/            capas dos projetos (.webp)
  media/videos/            vídeos (.mp4)
  media/gallery/           imagens complementares (.webp)
```

## Primeiros passos (checklist)

1. **Contatos**: em `assets/js/config.js`, preencha `whatsappNumber` (só números, com 55 + DDD),
   `whatsappMessage`, `email`, `instagram` e `linkedin`. Itens vazios ficam ocultos.
2. **Formulário**: escolha o provedor em `form` (veja abaixo).
3. **Foto**: substitua `assets/img/perfil.webp` (proporção 4:5, ~900×1125 px).
4. **Biografia**: edite os textos da seção "Sobre" no `index.html` (procure por `id="sobre"`).
5. **Projetos reais**: cadastre em `assets/js/projects.js` e apague os demonstrativos.
6. **Modo demonstração**: quando terminar, mude `demoMode: false` no `config.js`
   (remove o selo "Conteúdo demonstrativo" e o aviso de canais não configurados).
7. **Imagem de compartilhamento**: substitua `assets/img/og-image.jpg` (1200×630).

## Como adicionar um projeto

Copie um bloco em `TEAM_SEA_PROJECTS` (`assets/js/projects.js`) e ajuste:

```js
{
  id: "campanha-verao",                 // único, sem espaços
  title: "Campanha de Verão",
  category: "reels-avancado",           // motion | horizontal | reels-simples | reels-avancado | social | branding
  year: 2026,
  ratio: "9:16",                        // 16:9 | 9:16 | 1:1 | 4:5 | 4:3
  thumbnail: "assets/media/thumbs/campanha-verao.webp",
  preview: "assets/media/videos/campanha-verao-preview.mp4",  // opcional: loop curto e mudo para o hover
  video: "assets/media/videos/campanha-verao.mp4",            // ou "https://youtu.be/ID" / "https://vimeo.com/ID"
  client: "Marca X",
  description: "Resumo curto que aparece no card.",
  objective: "Objetivo do projeto.",
  process: "Processo criativo.",
  tools: ["Adobe After Effects", "Adobe Premiere Pro"],
  gallery: ["assets/media/gallery/campanha-verao-1.webp"],
  featured: true                        // aparece em "Trabalhos em destaque"
}
```

Pronto: card, filtro, contador, modal, navegação anterior/próximo e link direto
(`#/projeto/campanha-verao`) são gerados automaticamente. Projetos de branding aceitam
também `palette: ["#hex", ...]` e `typography: ["Fonte — uso"]` para o estudo de caso.
A ordem na lista é a ordem de exibição.

Vídeos do YouTube/Vimeo carregam só quando o visitante clica em reproduzir (economiza dados).
Nenhum vídeo começa com som automaticamente; as prévias dos cards são sempre mudas.

## Otimizando mídias (recomendado)

```bash
# capa WebP a partir de um frame do vídeo (aos 2 segundos)
ffmpeg -ss 2 -i video.mp4 -frames:v 1 -vf "scale=1280:-2" -c:v libwebp -quality 78 capa.webp

# prévia curta e muda para o hover (6 s, 720 px, sem áudio)
ffmpeg -i video.mp4 -t 6 -vf "scale=720:-2" -an -c:v libx264 -crf 28 -preset veryfast -movflags +faststart preview.mp4

# vídeo principal pronto para web
ffmpeg -i master.mov -vf "scale=1920:-2" -c:v libx264 -crf 22 -preset veryfast -c:a aac -b:a 160k -movflags +faststart video.mp4
```

Para vídeos longos ou pesados, prefira hospedar no YouTube/Vimeo e usar o link no campo `video`.

## Formulário de contato (envio real)

O formulário valida os campos e envia de verdade. Se não estiver configurado, ele **avisa que a
mensagem não foi enviada** e oferece WhatsApp/e-mail — nunca simula sucesso.

- **FormSubmit (mais simples, sem cadastro)**: `provider: "formsubmit"` e `formsubmitEmail: "seu@email.com"`.
  O primeiro envio dispara um e-mail de ativação para esse endereço; confirme-o uma vez.
- **Formspree**: crie um formulário em formspree.io, use `provider: "formspree"` e cole a URL em `endpoint`.
- **Endpoint próprio**: `provider: "custom"` e `endpoint` com uma URL que aceite `POST` JSON
  (`name`, `email`, `project_type`, `message`) e responda 2xx.

Há um campo anti-spam invisível (honeypot).

## Ferramentas e habilidades

Edite as listas `tools` e `skills` em `config.js`. Não existem barras ou níveis de proficiência.

## Publicação

Funciona em qualquer hospedagem estática: Netlify (arraste a pasta), Vercel, GitHub Pages,
Cloudflare Pages ou hospedagem comum via FTP. Depois de ter o domínio, atualize o
`<link rel="canonical">` e as URLs de `og:image` no `index.html` para endereços absolutos.

## Acessibilidade e desempenho

- Navegação por teclado completa: Tab, Enter, Esc fecha modal/lightbox/menu, setas ← → trocam
  de projeto no modal e de imagem no lightbox, setas também navegam entre os filtros.
- Link "Pular para o conteúdo", foco visível, `aria-*` nos componentes, contraste AA.
- Respeita `prefers-reduced-motion` (sem animações, sem prévias automáticas) e o modo de economia de dados.
- Lazy loading de imagens, vídeos com `preload="none"` carregados só no hover/visibilidade,
  fontes locais com `font-display: swap`.
- Cursor personalizado opcional (`customCursor` no `config.js`), ativo só em desktop com mouse.

## Conteúdo demonstrativo

As imagens e os vídeos de exemplo foram gerados de forma procedural (formas e gradientes), sem
nenhuma imagem de terceiros, e os clientes e textos dos projetos são fictícios. Substitua tudo
pelos trabalhos reais antes de divulgar o site.
