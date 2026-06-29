import Seo from '../components/Seo';
import InpersonaLoading from './components/InpersonaLoading';

export default function LoadingPage() {
  return (
    <>
      <Seo
        title="Inpersona · Nupur Kalele"
        description="Inpersona is warming up. A RAG chatbot that answers as Nupur Kalele."
        path="/loading"
        noindex
      />
      <InpersonaLoading />
    </>
  );
}
