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
    const {
      documentViewer,
      annotationManager,
      SaveOptions,
      PDFNet,
    } = instance.Core;

    const pfxFile = await fetch('/files/Correy.pfx');
    const fileArrayBuffer = await pfxFile.arrayBuffer();
    const samplePfxPassword = '123456';
    const xfdfString = await annotationManager.exportAnnotations();
    const data = await documentViewer.getDocument().getFileData({
      xfdfString,
      flags: SaveOptions.INCREMENTAL,
    });
    await PDFNet.runWithCleanup(async () => {
      const doc = await PDFNet.PDFDoc.createFromBuffer(new Uint8Array(data));
      const digSigFieldIterator = await doc.getDigitalSignatureFieldIteratorBegin();
      let foundOneDigitalSignature = false;
      for (digSigFieldIterator; await digSigFieldIterator.hasNext(); digSigFieldIterator.next()) {
        const field = await digSigFieldIterator.current();
        if (await field.hasCryptographicSignature()) {
          foundOneDigitalSignature = true;
          break;
        }
      }
      await doc.lock();
      const fieldName = "Signature1";
      const field = await doc.fieldCreate(
        fieldName,
        PDFNet.Field.Type.e_signature
      );
      const page1 = await doc.getPage(1);
      const widgetAnnot = await PDFNet.WidgetAnnot.create(
        await doc.getSDFDoc(),
        await PDFNet.Rect.init(100, 100, 200, 200),
        field
      );
      page1.annotPushBack(widgetAnnot);
      widgetAnnot.setPage(page1);
      const widgetObj = await widgetAnnot.getSDFObj();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext("2d");
      ctx.font = "16px Arial";
      ctx.fillText("Digitally Signed By Correy", 10, 50);
      ctx.fillText("DN: cn=Correy, c=CA", 10, 75);
      /**
       * Promise wrapper for the Canvas.toBlob callback method
       */
      const getCanvasBlob = (canvas) => {
        return new Promise((resolve) => {
          canvas.toBlob(blob => {
            resolve(blob)
          })
        })
      };
      const blobImg = await getCanvasBlob(canvas);
      const arrayBufferImg = await blobImg.arrayBuffer();
      const img = await PDFNet.Image.createFromMemory2(doc, arrayBufferImg);
      const found_approval_signature_widget = await PDFNet.SignatureWidget.createFromObj(widgetObj);
      await found_approval_signature_widget.createSignatureAppearance(img);
      widgetObj.putNumber("F", 132);
      widgetObj.putName("Type", "Annot");

      const sigField = await PDFNet.DigitalSignatureField.createFromField(field);

      if (!foundOneDigitalSignature) {
        /**
         * No Signature Field with a Cryptographic signature was found in
         * the document, therefore we should explicitly set DocMDP
         */
        await sigField.setDocumentPermissions(
          PDFNet.DigitalSignatureField.DocumentPermissions
            .e_annotating_formfilling_signing_allowed
        );
      }

      await sigField.signOnNextSaveFromBuffer(
        fileArrayBuffer,
        samplePfxPassword,
      );

      const buf = await doc.saveMemoryBuffer(
        PDFNet.SDFDoc.SaveOptions.e_incremental
      );
      const blob = new Blob([buf], { type: 'application/pdf' });
      saveAs(blob, 'signed-doc.pdf');
    });
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
