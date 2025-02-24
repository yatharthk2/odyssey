<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Thanks again! Now go create something AMAZING! :D
-->



<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
<!--[![Stargazers][stars-shield]][stars-url]-->
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
<!--[![LinkedIn][linkedin-shield]][linkedin-url]-->



<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/yatharthk2/odyssey">
    <img src="https://github.com/yatharthk2/odyssey/blob/main/ivg/inpersona_img.png" alt="Logo" width="1080" height="500">
  </a>

  <p align="center">
    <h3 align="center">A Websites that explains your Professional Journey Intelligently</h3>
    <br />
    <a href="https://github.com/yatharthk2/odyssey"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://yatharthk.com/">View Demo</a>
    ·
    <a href="https://github.com/yatharthk2/odyssey/issues">Report Bug</a>
    ·
    <a href="https://github.com/yatharthk2/odyssey/issues">Request Feature</a>
  </p>
</p>

<!-- ABOUT THE PROJECT -->
## About The Project
Odyssey is not just a portfolio—it's your personal gateway to opportunity. Designed to showcase your projects, skills, and professional journey with precision and style, Odyssey redefines what it means to leave a lasting impression.

But what truly sets Odyssey apart? Introducing Inpersona AI—a revolutionary feature that brings your portfolio to life. This intelligent chatbot doesn’t just answer questions; it speaks as you. Whether it’s a recruiter looking to learn about your latest project or a potential client curious about your skills, Inpersona AI engages them as if they were talking to the real you.

🌟 Why Odyssey Stands Out:

🎯 Interactive Portfolio: Highlight your best work, technical skills, and professional milestones in a sleek, user-friendly interface.

🤖 Inpersona AI: Personalized conversations that mimic your tone, style, and expertise—so every interaction feels authentic.

📊 Smart Insights: Get real-time analytics on who’s visiting, what they’re viewing, and the questions they’re asking.

🎨 Customizable Design: Tailor the look and feel of your portfolio to reflect your unique personal brand.

With Odyssey, you're always present—even when you're not. It's more than a portfolio. It's your digital twin for the professional world.

Embark on your Odyssey—where your next opportunity is just a conversation away.

### Frontend Built With
1) TypeScript
2) React
3) NextJs
4) Tailwind CSS

### Backend Built With
1) Python
2) LLamaIndex
3) Huggingface
4) ChromaDB
5) FastAPI
 
## Backend Rag Architecture Explanation
### Knowledge Graph Search
This search is extremely accurate and handles difficult reasoning like a piece of cake. Firstly, data is inputted to the LLM to identify entities and their relations, which is then used to create a JSON-formatted large knowledge graph. ChromaDB is used to save this graph locally. The saved graph is then used to do entity-based search which returns relations and their properties. Knowledge graph takes more time than vector search but is much more accurate.
<img src="https://github.com/yatharthk2/odyssey/blob/main/ivg/kg_im.png" alt="diagram" width="1080" height="400">

### HyDe Query Transformation
HyDe stands for Hypothetical Document Embeddings and is based on the study “Precise Zero-Shot Dense Retrieval without Relevance Labels.” The idea is very simple — instead of using the user’s question for searching in the vector database, we use the LLM to generate a response (a virtual hypothetical document) and then use the response for searching in the vector database (to find similar answers). The good thing is that it provides very fluid and natural responses and retains high confidence while generating output. On the contrary, HyDe is really prone to excessive information sharing and hallucinating to some extent.
<img src="https://github.com/yatharthk2/odyssey/blob/main/ivg/kg_im.png" alt="diagram" width="1080" height="400">

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.



<!-- CONTACT -->
## Contact
* Contact Yatharth Kapadia @ yatharth.k3@outlook.com




<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/yatharthk2/odyssey?color=red&label=contributors&logo=github&logoColor=green&style=for-the-badge
[contributors-url]: https://github.com/yatharthk2/odyssey/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/yatharthk2/odyssey?color=red&logo=github&logoColor=green&style=for-the-badge
[forks-url]: https://github.com/yatharthk2/odyssey/network/members
<!--[stars-shield]: https://img.shields.io/github/stars/othneildrew/Best-README-Template.svg?style=for-the-badge-->
<!--[stars-url]: https://github.com/othneildrew/Best-README-Template/stargazers-->
[issues-shield]: https://img.shields.io/bitbucket/issues-raw/yatharthk2/odyssey?color=red&logo=github&logoColor=green&style=for-the-badge
[issues-url]:https://github.com/yatharthk2/odyssey/issues
[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=for-the-badge
[license-url]: https://github.com/yatharthk2/odyssey/blob/master/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/othneildrew
[product-screenshot]: C:\Users\yatha\OneDrive\Desktop\projects\odyssey_project\odyssey\train_video.gif
