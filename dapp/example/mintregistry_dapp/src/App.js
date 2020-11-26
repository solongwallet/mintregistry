import React from 'react';
import TextField from '@material-ui/core/TextField'
import Container from '@material-ui/core/Box'
import Divider from '@material-ui/core/Divider'
import logo from './logo.svg';
import './App.css';

import {mnemonicToSecretKey} from './utils'

import { LAMPORTS_PER_SOL,Account, PublicKey, Connection, SystemProgram ,Transaction,sendAndConfirmTransaction} from '@solana/web3.js';
import { Button,Grid } from '@material-ui/core';
import { MintRegistry } from './MintRegistry.js';

class Content extends React.Component {

  constructor(props) {
    super(props)
    this.state = {mnemonic:'degree person wagon table brown decrease tumble major mouse sword crawl advice', 
                  mint:'3TGzz7sWKbtyzNpwh1anAoo6mEwFGRt8JYLrgNAeJQSG',
                  symbol:'CZCOIN',
                  name:"CZ's Coin",
                  extAccount:'',
                };
    this.onImport = this.onImport.bind(this);
    this.onRegister = this.onRegister.bind(this);
    this.onMint = this.onMint.bind(this);
    this.onSymbol = this.onSymbol.bind(this);
    this.onName = this.onName.bind(this);
    this.onQuery = this.onQuery.bind(this);

    //let url =  'http://api.mainnet-beta.solana.com';
    let url =  'http://150.109.237.56:8899';
    this.connection = new Connection(url);
    this.programID = new PublicKey('BFnCttWPPjKvtny554kDoV6Br1QHVP2A2BrpdodQJAxu')
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
        <Divider />
        <React.Fragment>
          <TextField multiline label="mint" onChange={this.onMint}/>
          <TextField multiline label="symbol" onChange={this.onSymbol}/>
          <TextField multiline label="name" onChange={this.onName}/>
          <Button onClick={this.onRegister}> Register</Button>
        </React.Fragment>
        <React.Fragment>
          <p> Mint Extension: {this.state.extAccount} </p>
        </React.Fragment>

        <Divider />
        <React.Fragment>
          <TextField multiline label="mint" onChange={this.onMint}/>
          <Button onClick={this.onQuery}>Query </Button>
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

  onQuery() {
    MintRegistry.GetMintExtension(
      this.connection,
      new PublicKey(this.state.mint),
      this.programID,
    ).then((exts)=>{
      console.log(exts);
    });
  }

  onRegister() {
    MintRegistry.RegisterMint(
      this.connection,
      this.account,
      new PublicKey(this.state.mint),
      this.state.symbol,
      this.state.name,
      this.programID,
    ).then((ext)=>{
      this.setState({extAccount:ext.extension})
    });
  }

  onMint(e) {
    this.setState({mint:e.target.value}); 
  }

  onSymbol(e) {
    this.setState({symbol:e.target.value}); 
  }

  onName(e) {
    this.setState({name:e.target.value}); 
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
