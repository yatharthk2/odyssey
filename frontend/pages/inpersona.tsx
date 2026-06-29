import Seo from '../components/Seo';
import InpersonaChat from './components/InpersonaChat';

export default function Inpersona() {
  return (
    <>
      <Seo
        title="Inpersona · Chat with Nupur's AI"
        description="Ask Inpersona anything about Nupur Kalele's work. A RAG chatbot built on FastAPI, LlamaIndex, and ChromaDB that answers as her, streaming over WebSockets."
        path="/inpersona"
      />
      <InpersonaChat />
    </>
  );
}
