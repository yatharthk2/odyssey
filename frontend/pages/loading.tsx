import Seo from '../components/Seo';
import InpersonaLoading from './components/InpersonaLoading';

export default function LoadingPage() {
  return (
    <>
      <Seo
        title="Inpersona · Yatharth Kapadia"
        description="Inpersona is warming up. A RAG chatbot that answers as Yatharth Kapadia."
        path="/loading"
        noindex
      />
      <InpersonaLoading />
    </>
  );
}
