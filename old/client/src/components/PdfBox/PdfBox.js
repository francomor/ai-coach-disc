import './PdfBox.css';
import React, {useEffect, useState} from "react";
import axios from "axios";
import {myConfig} from "../../config";

const PdfBox = ({accessToken, setToken, removeToken, pdfActiveFileName, setPdfActiveFileName}) => {
  const [file, setFile] = useState();
  const [errorValue, setErrorValue] = useState("");
  const [isSendingQueryToAPI, setIsSendingQueryToAPI] = useState(false);


  useEffect(() => {
    getExistentPdfFileName();
  }, [])

  function getExistentPdfFileName() {
    axios.get(myConfig.apiUrl.concat("/pdf_file_name"), {
        headers: {
            "Authorization": 'Bearer ' + accessToken
        }
    })
        .then((response) => {
            const data = response.data;
            const fileName = data.pdf_file_name;
            if (data.access_token) {
                setToken(data.access_token);
            }
            setPdfActiveFileName(fileName);
        }).catch((error) => {
        if (error.response) {
            if ([401, 403, 422].includes(error.response.status)) {
                removeToken();
            }
        }
    })
  }

  function handleFileChange(event) {
    setFile(event.target.files[0]);
  }

  function handleSubmit(event) {
    event.preventDefault();
    let formData = new FormData();
    formData.append("file", file);
    setIsSendingQueryToAPI(true);
    axios.post(myConfig.apiUrl.concat("/upload_pdf"), formData, {
        headers: {
            "Content-Type": 'multipart/form-data',
            "Authorization": 'Bearer ' + accessToken
        }
    })
    .then((response) => {
        const data = response.data;
        const upload_status = data.status;
        if (data.access_token) {
            setToken(data.access_token);
        }
        if (upload_status !== 1){
            setErrorValue('Error uploading file');
        }
        else {
            setPdfActiveFileName(data.pdf_file_name);
        }
        setIsSendingQueryToAPI(false);
    }).catch((error) => {
        if (error.response) {
            if ([401, 403, 422].includes(error.response.status)) {
                removeToken();
            }
            else {
                setErrorValue(error.response.data.msg)
            }
        }
        setIsSendingQueryToAPI(false);
    })
  }

  function handleClear(event) {
    setIsSendingQueryToAPI(true);
    event.preventDefault();
    axios.post(myConfig.apiUrl.concat("/clear_pdf_select"), {}, {
        headers: {
            "Authorization": 'Bearer ' + accessToken
        }
    })
    .then((response) => {
        const data = response.data;
        const clear_status = data.status;
        if (data.access_token) {
            setToken(data.access_token);
        }
        if (clear_status !== 1){
            setErrorValue('Error clearing file');
        }
        else {
            setPdfActiveFileName("");
            setFile(null);
        }
        setIsSendingQueryToAPI(false);
    }).catch((error) => {
        if (error.response) {
            if ([401, 403, 422].includes(error.response.status)) {
                removeToken();
            }
            else {
                setErrorValue(error.response.data.msg)
            }
        }
        setIsSendingQueryToAPI(false);
    })
    }

  return (
    <div className="pdf-box">
        {pdfActiveFileName ? (
            <div className="pdf-file-name">
                PDF file: {pdfActiveFileName}
                <button
                    className="pdf-input-button"
                    type="submit"
                    onClick={handleClear}
                    style={{
                        backgroundColor: !isSendingQueryToAPI ? '#007bff': 'grey',
                        marginLeft: '1rem'
                    }}
                >Clear</button>
            </div>
          ) : (
            <form className="pdf-input" onSubmit={handleSubmit}>
                <input
                    type="file"
                    className="input-file"
                    placeholder="Upload PDF"
                    accept="application/pdf"
                    onChange={handleFileChange}
                />
                <button
                    className="pdf-input-button"
                    type="submit"
                    disabled={isSendingQueryToAPI}
                    style={{ backgroundColor: !isSendingQueryToAPI ? '#007bff': 'grey' }}
                >Upload</button>
                {isSendingQueryToAPI && <div className="processing-file">Processing file...</div>}
            </form>
          )}
    </div>
  );
};

export default PdfBox;
