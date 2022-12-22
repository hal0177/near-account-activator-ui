
import { useState, useEffect } from "react"
import styled from "styled-components"
import { useNetwork, useAccount, useConnect, useDisconnect, useSwitchNetwork } from "wagmi"

import { useWalletSelector } from "./context"

import mm from "./icons/mm.svg"
import wc from "./icons/wc.svg"
import cb from "./icons/cb.svg"

const icons = [ mm, wc, cb ]


const AppContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background-color: #222233;
`

const MainDisplay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 400px;
  padding: 0 0 5px;
  background-color: #eee;
  border-radius: 10px;
`

const Instruction = styled.div`
  margin: 10px 0;
  font-size: 16px;
  text-align: center;
  cursor: default;
`

const WalletBlock = styled.ul`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  list-style-type: none;
  width: 390px;
  height: ${ props => props.height }px;
  margin: 0;
  padding: 0;
`

const WalletButton = styled.li`
  display: ${ props => props.inactive ? "none" : "flex" };
  justify-content: center;
  align-items: center;
  width: 390px;
  height: 40px;
  margin-top: ${ props => props.margin }px;
  cursor: pointer;
  background-color: ${ props => props.invertBg ? "#ccccee" : "#ddd" };
  border-radius: 10px;

  &:hover {
    background-color: #ccccee;
    box-shadow: ${ props => props.invertBg ? "0px 0px 5px #ddddff" : "0" };
  }
`

const WalletIconSpacer = styled.div`
  display: flex;
  justify-content: center;
  width: 25%;
`

const WalletIcon = styled.img`
  width: 25px;
  height: 25px;
`



function App() {

  const { selector, modal, accounts, accountId } = useWalletSelector()

  const [ displayContinue, setDisplayContinue ] = useState(false)

  const { chain } = useNetwork()
  const { switchNetwork } = useSwitchNetwork()
  const { address, connector, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const handleSignIn = () => {
    modal.show()
  }

  const disconnectNear = async () => {
    const wallet = await selector.wallet()
    await wallet.signOut()
  }

  useEffect(() => {
    if(chain && chain.id !== 137) switchNetwork(137)
  }, [ chain, switchNetwork ])
  
  useEffect(() => {
    if(isConnected && selector.isSignedIn()) setDisplayContinue(true)
    else setDisplayContinue(false)
  }, [ isConnected, selector ])


  return (
    <AppContainer>
      <MainDisplay>
        {
          isConnected && connector
            ? <>
                <Instruction>Connected to { connector.name } { (address).slice(0, 7) }...{ (address).slice(39, 42) }</Instruction>
                <WalletButton onClick={ disconnect }>Disconnect</WalletButton>
              </>
            : <>
                <Instruction>Connect EVM Wallet to Polygon:</Instruction>
                <WalletBlock height={ 126 }>
                  {
                    connectors.map((c, i) => (
                      <WalletButton key={ c.id } onClick={ () => connect({ connector: c }) }>
                        <WalletIconSpacer><WalletIcon src={ icons[ i ] }/></WalletIconSpacer>
                        <div style={{ width: "50%" }}>{ c.name }</div>
                      </WalletButton>
                    ))
                  }
                </WalletBlock>
              </>
          }

          {
            selector.isSignedIn()
              ? <>
                  <Instruction>Connected to { (accountId).slice(0, 5) }...{ (accountId).slice(61, 64) }</Instruction>
                  <WalletButton onClick={ disconnectNear }>Disconnect</WalletButton>
                </>
              : <>
                  <Instruction>Connect NEAR Wallet:</Instruction>
                  <WalletButton onClick={ handleSignIn }>Choose Wallet</WalletButton>
                </>
          }

          <WalletButton inactive={ !displayContinue } margin={ 10 } invertBg={ true }>Continue</WalletButton>
      </MainDisplay>
    </AppContainer>
  )
}

export default App
