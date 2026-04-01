import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Plus Jakarta Sans', sans-serif;

    /* 🔥 LEBIH CERAH & DEPTH */
    background: radial-gradient(
        circle at 20% 20%,
        rgba(76, 103, 168, 0.6),
        transparent 40%
      ),
      radial-gradient(
        circle at 80% 0%,
        rgba(78, 96, 188, 0.66),
        transparent 40%
      ),
      linear-gradient(
        135deg,
        rgb(51, 75, 102) 0%,
        #729edb 40%,
        #5274cb 100%
      );

    color: #f1f5f9;
    -webkit-font-smoothing: antialiased;
    letter-spacing: 0.2px;
  }

  /* 🔥 Glass Card Lebih Terang & Clean */
  .glass-card {
    background: rgba(16, 24, 46, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(148, 163, 184, 0.18);
    box-shadow:
      0 10px 30px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  ::selection {
    background: #60a5fa;
    color: white;
  }

  button, input, textarea {
    transition: all 0.2s ease;
  }
`;

export default GlobalStyle;