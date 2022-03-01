import React, { useRef, useEffect } from 'react';
import WebViewer from '@pdftron/webviewer';
import './App.css';

const App = () => {
  const viewer = useRef(null);

  // if using a class, equivalent of componentDidMount 
  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        initialDoc: '/files/docusign-sample.pdf',
      },
      viewer.current,
    ).then((instance) => {
      const { documentViewer, annotationManager, Annotations } = instance.Core;

      documentViewer.addEventListener('documentLoaded', () => {

      });
    });
  }, []);

  const digitallySignPdf = async () => {
    // stub
    console.log('Hello World');
  };

  return (
    <div className="App">
      <div className="header">
        <button
          className="digital-signature-btn"
          onClick={digitallySignPdf}
        >
          Digitally Sign Document With Existing Digital Signature
        </button>
      </div>
      <div className="webviewer" ref={viewer}></div>
    </div>
  );
};

export default App;
