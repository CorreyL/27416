import React, { useRef, useEffect, useState } from 'react';
import { saveAs } from 'file-saver';
import WebViewer from '@pdftron/webviewer';
import './App.css';

const App = () => {
  const viewer = useRef(null);
  const [docReadyToSign, setDocReadyToSign] = useState(false);
  const [instance, setInstance] = useState();

  // if using a class, equivalent of componentDidMount 
  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        fullAPI: true,
        initialDoc: '/files/docusign-sample.pdf',
        /**
         * @note A valid license key with Create Digital Signature permission
         * from PDFTron is required in order for this to work, because the
         * trial will create a watermark on the document, which is considered a
         * modification, thus invalidating the original Digital Signature
         */
        // licenseKey: '',
      },
      viewer.current,
    ).then((instance) => {
      setInstance(instance);

      const {
        documentViewer,
      } = instance.Core;

      documentViewer.addEventListener('documentLoaded', () => {
        setDocReadyToSign(true);
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
          disabled={!docReadyToSign}
        >
          Digitally Sign Document With Existing Digital Signature
        </button>
      </div>
      <div className="webviewer" ref={viewer}></div>
    </div>
  );
};

export default App;
