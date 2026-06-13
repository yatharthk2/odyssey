import Seo from '../components/Seo';
import InpersonaChat from './components/InpersonaChat';

export default function Inpersona() {
  return (
    <>
      <Seo
        title="Inpersona · Chat with Yatharth's AI"
        description="Ask Inpersona anything about Yatharth Kapadia's work. A RAG chatbot built on FastAPI, LlamaIndex, and ChromaDB that answers as him, streaming over WebSockets."
        path="/inpersona"
      />
      <InpersonaChat />
    </>
  );
}
