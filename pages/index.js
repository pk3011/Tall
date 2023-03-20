import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

import { Button, Form, Grid, Header, Message, Radio, Segment } from 'semantic-ui-react';
import { useEffect, useState } from 'react';

export default function Home() {

  const [rmn, setRmn] = useState("");
  const [sid, setSid] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [theUser, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setError] = useState("");
  const [dynamicUrl, setDynamicUrl] = useState("");
  const [loginType, setLoginType] = useState("OTP");
  const [pwd, setPwd] = useState("");


  useEffect(() => {
    let tok = localStorage.getItem("token");
    let userd = localStorage.getItem("userDetails");
    if (tok !== undefined && userd !== undefined) {
      setToken(tok);
      setUser(JSON.parse(userd));
    }
  }, []);

  useEffect(() => {
    if (theUser !== null) {
      if (theUser.acStatus !== "DEACTIVATED") {
        var myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer 5e268d59f81a9be4004e74f691f349a2fb57a961");
        myHeaders.append("Content-Type", "application/json");
        console.log('mko');
        console.log(process.env.REACT_APP_M3U_FUNCTION_BASE_URL);
        var raw = JSON.stringify({
          "long_url": window.location.origin.replace('localhost', '127.0.0.1') + '/api/getM3u?sid=' + theUser.sid + '_' + theUser.acStatus[0] + '&id=' + theUser.id + '&sname=' + theUser.sName + '&tkn=' + token// + '&ent=' + theUser.entitlements.map(x => x.pkgId).join('_')
        });

        var requestOptions = {
          method: 'POST',
          headers: myHeaders,
          body: raw,
          redirect: 'follow'
        };

        fetch("https://api-ssl.bitly.com/v4/shorten", requestOptions)
          .then(response => response.text())
          .then(result => {
            console.log(result);
            setDynamicUrl(JSON.parse(result).link);
          })
          .catch(error => console.log('error', error));
      }
      else
        console.log(window.location.origin.replace('localhost', '127.0.0.1') + '/api/getM3u?sid=' + theUser.sid + '_' + theUser.acStatus[0] + '&id=' + theUser.id + '&sname=' + theUser.sName + '&tkn=' + token + '&ent=' + theUser.entitlements.map(x => x.pkgId).join('_'));
    }
    else
      setDynamicUrl("");
  }, [theUser, token])

  const getOTP = () => {
    setLoading(true);
    fetch("/api/getOtp?rmn=" + rmn)
      .then(response => response.text())
      .then(result => {
        const res = JSON.parse(result);
        setLoading(false);
        console.log(res);
        if (res.message.toLowerCase().indexOf("otp") > -1 && res.message.toLowerCase().indexOf("successfully") > -1) {
          setOtpSent(true);
          setError("");
        }
        else
          setError(res.message);
      })
      .catch(error => {
        console.log('error', error);
        setError(error.toString());
      });
  }

  const authenticateUser = () => {
    setLoading(true);
    fetch("/api/getAuthToken?sid=" + sid + "&loginType=" + loginType + "&otp=" + otp + "&rmn=" + rmn)
      .then(response => response.text())
      .then(result => {
        const res = JSON.parse(result);
        console.log(res);
        if (res.code === 0) {
          let userDetails = res.data.userDetails;
          userDetails.id = res.data.userProfile.id;
          let token = res.data.accessToken;
          setUser(userDetails);
          setToken(token);
          localStorage.setItem("userDetails", JSON.stringify(userDetails));
          localStorage.setItem("token", token);
          setError("");
        }
        else
          setError(res.message);
        setLoading(false);
      })
      .catch(error => {
        console.log('error', error);
        setError(error.toString());
        setLoading(false);
      });
  }

  const logout = () => {
    localStorage.clear();
    setRmn("");
    setSid("");
    setOtpSent(false);
    setOtp("");
    setPwd("");
    setUser(null);
    setToken("");
    setLoading(false);
  }

  return (
    <div>
      {
        <Grid columns='equal' padded centered>
          {
            token === "" || theUser === null ?
              <Grid.Row>
                <Grid.Column computer={8} tablet={12} mobile={16}>
                  <Segment loading={loading}>
                    <Form>
                      <Form.Group inline>
                        <label><h1>Login to your Tata Play account</h1></label>
                      </Form.Group>

                      {
                        loginType === 'OTP' ?
                          <>
                            <Form.Field disabled={otpSent}>
                              <label>RMN</label>
                              <input value={rmn} placeholder='Registered Mobile Number' onChange={(e) => setRmn(e.currentTarget.value)} />
                            </Form.Field>
                            <Form.Field disabled={otpSent}>
                              <label>Subscriber ID</label>
                              <input value={sid} placeholder='Subscriber ID' onChange={(e) => setSid(e.currentTarget.value)} />
                            </Form.Field>
                            <Form.Field disabled={!otpSent}>
                              <label>OTP</label>
                              <input value={otp} placeholder='OTP' onChange={(e) => setOtp(e.currentTarget.value)} />
                            </Form.Field>
                            {
                              otpSent ? <Button primary onClick={authenticateUser}>Login</Button> :
                                <Button primary onClick={getOTP}>Get OTP</Button>
                            }
                          </>
                          :
                          <>
                          </>
                      }

                    </Form>
                  </Segment>
                </Grid.Column>
              </Grid.Row> :
              
              <Grid.Row>
                <Grid.Column textAlign='center' computer={8} tablet={12} mobile={16}>
                  <Segment loading={loading}>
                    <Header as="h1">Welcome, {theUser.sName}</Header>
                    {
                      theUser !== null && theUser.acStatus !== "DEACTIVATED" ?
                        <Message>
                          <Message.Header>Your Dynamic Playlist URL is:
                          <h3><a href={dynamicUrl}>{dynamicUrl}</a></h3></Message.Header>
                          <h3>This generated URL works in NS Player, OTT Navigator & Tivimate app.</h3>
                        </Message>
                        :
                        <Header as='h3' style={{ color: 'red' }}>Your Tata Sky Connection is deactivated.</Header>
                    }

                    <Button negative onClick={logout}>Logout</Button>
                  </Segment>
                </Grid.Column>
              </Grid.Row>
          }
          <Grid.Row style={{ display: err === '' ? 'none' : 'block' }}>
            <Grid.Column></Grid.Column>
            <Grid.Column computer={8} tablet={12} mobile={16}>
              <Message color='red'>
                <Message.Header>Error</Message.Header>
                <p>
                  {err}
                </p>
              </Message>
            </Grid.Column>
            <Grid.Column textAlign='center' computer={8} tablet={12} mobile={16}>
              <a href="https://github.com/" target="_blank" rel="noreferrer">View source code on Github</a>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      }
    </div>
  )
}
