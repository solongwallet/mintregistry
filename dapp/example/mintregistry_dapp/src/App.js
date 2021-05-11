import React from 'react';
import TextField from '@material-ui/core/TextField'
import Container from '@material-ui/core/Box'
import Divider from '@material-ui/core/Divider'
import logo from './logo.svg';
import './App.css';

import {mnemonicToSecretKey} from './utils'

import { LAMPORTS_PER_SOL,Account, PublicKey, Connection, SystemProgram ,Transaction,sendAndConfirmTransaction} from '@solana/web3.js';
import { Button,Grid } from '@material-ui/core';
import { MintRegistry,ProgramID } from './MintRegistry.js';

class Content extends React.Component {

  constructor(props) {
    super(props)
    this.state = {mnemonic:'', 
                  mint:'',
                  symbol:'',
                  name:"",
                  extAccount:'',
                  decimals:0,
                  supply:0,
                  mint_authority:"",
                  freeze_authority:"",
                };
    this.onImport = this.onImport.bind(this);
    this.onRegister = this.onRegister.bind(this);
    this.onMint = this.onMint.bind(this);
    this.onSymbol = this.onSymbol.bind(this);
    this.onName = this.onName.bind(this);
    this.onQuery = this.onQuery.bind(this);
    this.onModify = this.onModify.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onQueryBySymbol = this.onQueryBySymbol.bind(this);
    this.onMintAuthority = this.onMintAuthority.bind(this);
    this.onFreezeAuthority = this.onFreezeAuthority.bind(this);
    this.onSupply = this.onSupply.bind(this);
    this.onDecimals = this.onDecimals.bind(this);

    //let url =  'http://api.mainnet-beta.solana.com';
    //let url =  'http://150.109.237.56:8899';
    let url =  'https://devnet.solana.com';
    this.connection = new Connection(url);
    this.programID = new PublicKey(ProgramID);
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
        <TextField multiline label="mint_authority" onChange={this.onMintAuthority}/>
        <TextField multiline label="freeze_authority" onChange={this.onFreezeAuthority}/>
        <TextField multiline label="supply" onChange={this.onSupply}/>
        <TextField multiline label="decimals" onChange={this.onDecimals}/>
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
        <Divider />
        <React.Fragment>
          <TextField multiline label="mint" onChange={this.onMint}/>
          <TextField multiline label="symbol" onChange={this.onSymbol}/>
          <TextField multiline label="name" onChange={this.onName}/>
          <Button onClick={this.onModify}> Modify</Button>
        </React.Fragment>
        <Divider />
        <React.Fragment>
          <TextField multiline label="mint" onChange={this.onMint}/>
          <Button onClick={this.onClose}> Close</Button>
        </React.Fragment>
        <Divider />
        <React.Fragment>
          <TextField multiline label="symbol" onChange={this.onSymbol}/>
          <Button onClick={this.onQueryBySymbol}>QueryBySymbol </Button>
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


  onModify() {
    MintRegistry.ModifyMint(
      this.connection,
      this.account,
      new PublicKey(this.state.extAccount),
      new PublicKey(this.state.mint),
      this.state.symbol,
      this.state.name,
      this.programID,
    ).then(()=>{
      console.log("done modify");
    }).catch((e)=>{
      console.log("modify error:", e);
    });
  }

  onClose() {
    MintRegistry.CloseMint(
      this.connection,
      this.account,
      new PublicKey(this.state.extAccount),
      new PublicKey(this.state.mint),
      this.programID,
    ).then(()=>{
      console.log("done close");
    }).catch((e)=>{
      console.log("close error:", e)
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

  onQueryBySymbol() {
    MintRegistry.GetMintExtensionBySymbol(
      this.connection,
      this.state.symbol,
      this.programID,
    ).then((exts)=>{
      console.log(exts);
    })

  }

  onRegister() {
    MintRegistry.RegisterMint(
      this.connection,
      this.account,
      new PublicKey(this.state.mintAuthority),
      new PublicKey(this.state.freezeAuthority),
      this.state.supply,
      this.state.decimals,
      new PublicKey(this.state.mint),
      this.state.symbol,
      this.state.name,
      this.programID,
    ).then((ext)=>{
      this.setState({extAccount:ext.extension})
    });
  }

  onSupply(e) {
    this.setState({supply:e.target.value}); 
  }

  onMintAuthority(e) {
    this.setState({mintAuthority:e.target.value}); 
  }

  onFreezeAuthority(e) {
    this.setState({freezeAuthority:e.target.value}); 
  }

  onDecimals(e) {
    this.setState({decimals:e.target.value}); 
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
