import './dashboard.css';
import Header from './Components/Header';
import React, { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import axios from 'axios';
import Loader from './Components/Loader';

const API_URL = `${process.env.REACT_APP_PYTHON_BACKEND}`;

const Dashboard = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [imageCount, setImageCount] = useState(0);
  const [deviation, setDeviation] = useState(1);
  const [defects, setDefects] = useState(0);
  const [missing, setMissing] = useState(0);

  const handleFileUpload = async () => {
    setIsLoading(true);
    const res = await axios.get(`${API_URL}/upload`);
    setIsLoading(false);
    setSelectedFile(res.data.data.name);
    setImageCount(imageCount + 1);
  };

  const handleStartQC = async () => {
    setIsLoading(true);
    const res = await axios.get(`${API_URL}/analysis`);
    setIsLoading(false);
    setResult(res?.data?.data?.analysis);
    setDeviation(res?.data?.data?.dividend);
    let missingele = 0;
    let defectsele = 0;
    if (typeof res?.data?.data?.analysis === 'string') return;
    res?.data?.data?.analysis?.forEach((element) => {
      if (element?.present === false) {
        missingele++;
      }
      if (element?.dev && element?.dev / res?.data?.data?.dividend > 1) {
        defectsele++;
      }
    });
    setMissing(missingele);
    setDefects(defectsele);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setImageCount(0);
    setDeviation(1);
    setDefects(0);
    setMissing(0);
  };

  return (
    <>
      {isLoading ? <Loader /> : null}
      <Header />
      <div className="image-container">
        <Row>
          <Col>
            <p style={{ textAlign: 'center' }}>Input from Assembly Line</p>
          </Col>
          <Col>
            <p style={{ textAlign: 'center' }}>Post Analysis</p>
          </Col>
        </Row>
        <Row>
          <Col
            className="image-div"
            style={{
              marginRight: '10px',
              height: selectedFile ? 'auto' : '400px',
            }}
          >
            {selectedFile && (
              <img
                src={`${API_URL}/images?params=${selectedFile}&args=${imageCount}`}
                alt={imageCount}
              />
            )}
          </Col>
          <Col className="image-div" style={{ marginLeft: '10px' }}>
            {result && (
              <img
                src={`${API_URL}/images?params=result.jpg&args=${imageCount}`}
                alt={imageCount}
              />
            )}
          </Col>
        </Row>
      </div>
      {result ? (
        <div className="result">
          <div
            className="parts"
            style={{ color: missing > 0 ? 'red' : 'green' }}
          >
            {missing > 0 ? `${missing} Parts Missing` : 'All Parts Present'}
          </div>
          <div className="test-result">
            {defects + missing > 0
              ? `QC Failed - ${defects + missing} Issues Found`
              : 'QC Passed'}
          </div>
          <div className="processing-time">
            Processing Time: {result[0].toFixed(2)} sec
          </div>
          <button
            type="button"
            className="btn btn-primary px-4 py-2 rounded mt-2"
            onClick={handleReset}
          >
            Process Next
          </button>
        </div>
      ) : (
        <div className="text-center mb-4">
          <button
            type="button"
            className={`btn btn-${
              selectedFile !== null ? 'danger' : 'primary'
            } px-4 py-2 rounded`}
            onClick={handleFileUpload}
          >
            {selectedFile !== null ? 'Retake' : 'Start Test'}
          </button>
          <br />
          {selectedFile && (
            <button
              type="button"
              className={`btn btn-primary px-4 py-2 rounded mt-2`}
              onClick={handleStartQC}
            >
              Start QC
            </button>
          )}
        </div>
      )}
      {result && (
        <div className="tableData" style={{ marginTop: '40px' }}>
          <div className="d-flex justify-content-between align-items-center">
            <span className="logboook">QC Analysis</span>
          </div>
          <div className="table-cont" style={{ marginTop: '20px' }}>
            <div
              style={{ width: '35%', color: '#52575C', textAlign: 'center' }}
            >
              Part Name
            </div>
            <div style={{ color: '#52575C', textAlign: 'center' }}>
              Dimension (mm)
            </div>
            <div style={{ color: '#52575C', textAlign: 'center' }}>Present</div>
            <div style={{ color: '#52575C', textAlign: 'center' }}>
              Deviation (mm)
            </div>
          </div>
          {result.map((item, i) => {
            if (i === 0) return null;
            return (
              <div className="table-cont" key={i}>
                <div
                  style={{ width: '35%', color: 'gray', textAlign: 'center' }}
                >
                  {item?.name}
                </div>
                <div
                  style={{
                    color: 'gray',
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                >
                  {item?.dim ? (item?.dim / deviation).toFixed(2) : '--'}
                </div>
                <div
                  style={{
                    color: `${item?.present ? 'green' : 'red'}`,
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                >
                  {item?.present ? 'True' : 'False'}
                </div>
                <div
                  style={{
                    color: `${
                      item?.dev
                        ? item?.dev / deviation > 1
                          ? 'red'
                          : 'gray'
                        : 'gray'
                    }`,
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                >
                  {item?.dev ? (item?.dev / deviation).toFixed(2) : '--'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default Dashboard;
