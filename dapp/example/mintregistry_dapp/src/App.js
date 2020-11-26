import React from 'react';
import TextField from '@material-ui/core/TextField'
import Container from '@material-ui/core/Box'
import logo from './logo.svg';
import './App.css';

import {mnemonicToSecretKey} from './utils'

import { LAMPORTS_PER_SOL,Account, PublicKey, Connection, SystemProgram ,Transaction,sendAndConfirmTransaction} from '@solana/web3.js';
import { Button,Grid } from '@material-ui/core';

class Content extends React.Component {

  constructor(props) {
    super(props)
    this.state = {mnemonic:'degree person wagon table brown decrease tumble major mouse sword crawl advice', 
                };
    this.onImport = this.onImport.bind(this);

    //let url =  'http://api.mainnet-beta.solana.com';
    let url =  'http://150.109.237.56:8899';
    this.connection = new Connection(url);
  }


  render() {
    return (
      <Container>
        <React.Fragment>
          <TextField multiline label="mnemonic" onChange={this.onMnemonic}/>
          <Button onClick={this.onImport}> import </Button>
        </React.Fragment>
        <React.Fragment>
          <p> PublicKey: {this.state.publicKey} </p>
        </React.Fragment>
      </Container>
    );
  }

  onImport() {
    console.log("import:", this.state.mnemonic);
    this.setState({publicKey: 'account.publicKey'});
    mnemonicToSecretKey(this.state.mnemonic).then((key) => {
      this.account = new Account(key);
      console.log(`pubkey:${this.account.publicKey}`);
      this.setState({publicKey: this.account.publicKey.toBase58()}, () => {
        console.log(this.state.publicKey);
      });
    });
  }

  onMnemonic(e) {
    console.log("mneomonic:", e.target.value);
    this.setState({mnemonic:e.target.value});
  }
}


function App() {
  return (
    <Content />
  );
}

export default App;
