
import { useState, useEffect, useCallback } from "react"
import styled from "styled-components"
import { useProvider, useSigner, useContract, useNetwork, useAccount, useConnect, useDisconnect, useSwitchNetwork } from "wagmi"
import { ethers } from "ethers"

import { useWalletSelector } from "./context"

import { activatorAbi } from "./activatorAbi"

import mm from "./icons/mm.svg"
import wc from "./icons/wc.svg"
import cb from "./icons/cb.png"

const icons = [ mm, wc, cb ]


const AppContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background-color: #111122;
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
  font-weight: bold;
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

const RefundButton = styled.div`
  display: ${ props => props.active ? "flex" : "none" };
  justify-content: center;
  align-items: center;
  width: 390px;
  height: 40px;
  margin: 5px 0;
  cursor: pointer;
  background-color: #eebbbb;
  border-radius: 10px;

  &:hover {
    background-color: #ffcccc;
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

const WalletHighlight = styled.span`
  color: #3333bb;
  font-weight: bold;
`

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 5px 0 10px;
  width: 390px;
  cursor: default;
`

const PriceTitle = styled.div`
  margin-left: 5px;
  font-size: 16px;
  text-align: center;
`

const Price = styled.div`
  margin-right: 5px;
  font-weight: bold;
`

const StatusBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 390px;
  margin: 5px 0;
  background-color: #ccccee;
  outline: 2px solid #9999bb;
  border-radius: 10px;
  cursor: default;
`

const StatusRow = styled.div`
  display: flex;
  margin: 5px 0;
`

const Notification = styled.div`
  margin: 4px 0 0;
  color: red;
`



function App() {

  const { selector, modal, accountId } = useWalletSelector()

  const [ displayContinue, setDisplayContinue ] = useState(false)
  const [ bothWalletsConnected, setBothWalletsConnected ] = useState(false)
  const [ activationPrice, setActivationPrice ] = useState(ethers.BigNumber.from("0"))
  const [ activation, setActivation ] = useState(null)
  const [ notification, setNotification ] = useState("")

  const provider = useProvider()
  const { data: signer } = useSigner()
  const activator = useContract({
    address: "0x2De68366eF3F5cB580a210312CDa5adA218deb5c",
    abi: activatorAbi,
    signerOrProvider: signer
  })
  const { chain } = useNetwork()
  const { switchNetwork } = useSwitchNetwork()
  const { address, connector, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const formatEvmAddr = (addr) => {
    return `${ (addr).slice(0, 7) } ... ${ (addr).slice(39, 42) }`
  }

  const formatNearAddr = (accId) => {
    return `${ (accId).slice(0, 5) } ... ${ (accId).slice(61, 64) }`
  }

  const getStatusCode = (status) => {
    const statusCodes = [
      "Unknown",
      "Accepted, waiting to receive money on NEAR.",
      "Success.",
      "Failed (refund)",
      "Refunded."
    ]
    return statusCodes[ status ]
  }

  const handleSignIn = () => {
    modal.show()
  }

  const disconnectNear = async () => {
    const wallet = await selector.wallet()
    await wallet.signOut()
  }

  const getPrice = useCallback(async () => {
    const priceWei = await activator.price()
    setActivationPrice(priceWei)
  }, [ activator ])

  const handleActivateClick = useCallback(async () => {
    if(isConnected && address && accountId && !activationPrice.isZero()) {
      const bal = await provider.getBalance(address)
      if(bal.lt(activationPrice)) {
        setNotification(`Insufficient Balance.`)
        return
      }
      try {
        const activationTx = await activator.activate(accountId, address, { value: activationPrice })
        await activationTx.wait()
      } catch(err) {
        console.log(err.message)
      }
    }
  }, [ isConnected, provider, address, accountId, activationPrice, activator ])

  const handleGetResults = useCallback(async () => {
    const result = await activator.activationInfoOf(accountId)
    setActivation(result)
  }, [ activator, accountId ])

  const handleRefundClick = useCallback(async () => {
    if(isConnected && accountId && activation && Number(activation.status) === 3) {
      try {
        const refundTx = await activator.refund(accountId)
        await refundTx.wait()
      } catch(err) {
        console.log(err.message)
      }
    } 
  }, [ isConnected, accountId, activation, activator ])

  const handleContinueClick = () => {
    // get checksummed address, converts from base58
    const checksummed = ethers.utils.getAddress(address)
    // is address, network is polygon 
    if(ethers.utils.isAddress(checksummed) && chain.id === 137) {
      setDisplayContinue(false)
      setBothWalletsConnected(true)
    }
  }

  useEffect(() => {
    if(chain && chain.id !== 137) switchNetwork(137)
  }, [ chain, switchNetwork ])
  
  useEffect(() => {
    if(isConnected && selector.isSignedIn()) setDisplayContinue(true)
    else setDisplayContinue(false)
  }, [ isConnected, selector ])

  useEffect(() => {
    if(isConnected && signer) {
      getPrice()
    }
  }, [ isConnected, signer, getPrice ])


  if(bothWalletsConnected) {
    return (
      <AppContainer>
        <MainDisplay>
          <Instruction>Activate NEAR Account</Instruction>
          <PriceRow><PriceTitle>Activation Price</PriceTitle><Price>{ ethers.utils.formatUnits(activationPrice, "ether") } MATIC</Price></PriceRow>
          {
            activation
              ? <>
                  <StatusBox>
                    <StatusRow><div style={{ marginRight: "10px" }}>Activator Address:</div> <WalletHighlight>{ formatEvmAddr(activation.publicKey) }</WalletHighlight></StatusRow>
                    <StatusRow>{ getStatusCode(activation.status) }</StatusRow>
                  </StatusBox>
                </>
              : ""
          }
          <RefundButton onClick={ handleRefundClick } active={ activation && Number(activation.status) === 3 }>Refund</RefundButton>
          <WalletBlock height={ 83 }>
            <WalletButton onClick={ handleActivateClick }>Activate</WalletButton>
            <WalletButton onClick={ handleGetResults }>Get Result</WalletButton>
          </WalletBlock>
          { notification ? <Notification>{ notification }</Notification> : "" }
        </MainDisplay>
      </AppContainer>
    )
  }


  if(!bothWalletsConnected) {
  return (
    <AppContainer>
      <MainDisplay>
        {
          isConnected && connector
            ? <>
                <Instruction>Connected to { connector.name } <WalletHighlight>{ formatEvmAddr(address) }</WalletHighlight></Instruction>
                <WalletButton onClick={ disconnect }>Disconnect</WalletButton>
              </>
            : <>
                <Instruction>Connect EVM Wallet to Polygon</Instruction>
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
                  <Instruction>Connected to <WalletHighlight>{ formatNearAddr(accountId) }</WalletHighlight></Instruction>
                  <WalletButton onClick={ disconnectNear }>Disconnect</WalletButton>
                </>
              : <>
                  <Instruction>Connect NEAR Wallet</Instruction>
                  <WalletButton onClick={ handleSignIn }>Choose Wallet</WalletButton>
                </>
          }

          <WalletButton onClick={ handleContinueClick } inactive={ !displayContinue } margin={ 10 } invertBg={ true }>Continue</WalletButton>
      </MainDisplay>
    </AppContainer>
  )
  }
}

export default App