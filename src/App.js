
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
  background-color: ${ props => props.invertBg ? "#3333bb" : "#ccccee" };
  border-radius: 10px;
  color: ${ props => props.invertBg ? "#ccccee" : "#3333bb" };
  font-weight: bold;

  &:hover {
    background-color: ${ props => props.invertBg ? "#4444cc" : "#bbbbdd" };
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
  color: #bb4444;
  font-weight: bold;
  border-radius: 10px;

  &:hover {
    background-color: #ddaaaa;
  }
`

const NearWalletInput = styled.textarea`
  display: ${ props => props.inactive ? "none" : "flex" };
  justify-content: center;
  align-items: center;
  width: 370px;
  margin-top: 5px;
  padding: 10px;
  background-color: #ccccee;
  border: 0;
  border-radius: 10px;
  color: #3333bb;
  font-size: 16px;
  font-weight: bold;
  outline: none;
  resize: none;
 
  &:focus {
    outline: 2px solid #9999bb;
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
  margin: 10px 0 5px;
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
  padding: 0 10px;
  color: ${ props => props.status === 1 ? "red" : "#111122" };
`



function App() {

  const { selector, modal, accountId } = useWalletSelector()

  const [ displayContinue, setDisplayContinue ] = useState(false)
  const [ validatedNearAccId, setValidatedNearAccId ] = useState("")
  const [ bothWalletsConnected, setBothWalletsConnected ] = useState(false)
  const [ activationPrice, setActivationPrice ] = useState(ethers.BigNumber.from("0"))
  const [ activation, setActivation ] = useState(null)
  const [ notification, setNotification ] = useState({ message: "", status: 0 })
  const [ pastedAccountId, setPastedAccountId ] = useState("")
  const [ validPastedAccountId, setValidPastedAccountId ] = useState("")

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

  const isBase58AccountId = (accId) => {
    return Boolean(/^[A-HJ-NP-Za-km-z1-9]*$/.test(accId))
  }

  const isHexAccountId = (accId) => {
    return Boolean(/^[0-9a-f]*$/.test(accId))
  }

  const formatBase58AccountId = useCallback((accId) => {
    if(isBase58AccountId(accId)) return ethers.utils.hexlify(ethers.utils.base58.decode(accId)).slice(2)
    else return accId
  }, [])

  const formatEvmAddr = (addr) => {
    return `${ (addr).slice(0, 7) } ... ${ (addr).slice(39, 42) }`
  }

  const formatNearAddr = (accId) => {
    if(isBase58AccountId(accId)) return formatBase58AccountId(accId)
    else if(accId.length < 64) return accId
    else return `${ (accId).slice(0, 5) } ... ${ (accId).slice(61, 64) }`
  }

  const getStatusCode = (status) => {
    const statusCodes = [
      "Unknown activation status.",
      "Accepted, waiting to receive money on NEAR.",
      "Success.",
      "Failed (optional refund).",
      "Refunded."
    ]
    return statusCodes[ status ]
  }

  const displayActivate = () => {
    const loading = Boolean(notification.message === "Please wait ..." || notification.message === "Confirmed, please wait a few seconds and then get result.")
    const activated = Boolean(activation && (activation.status !== 0))
    return !loading && !activated
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
    if(isConnected && address && validatedNearAccId && !activationPrice.isZero()) {
      const bal = await provider.getBalance(address)
      if(bal.lt(activationPrice)) {
        setNotification({ message: `Insufficient Balance.`, status: 1 })
        return
      }
      try {
        setNotification({ message: `Please wait ...`, status: 0 })
        const activationTx = await activator.activate(validatedNearAccId, address, { value: activationPrice })
        await activationTx.wait()
        setNotification({ message: `Confirmed, please wait a few seconds and then get result.`, status: 0 })
      } catch(err) {
        setNotification({ message: ``, status: 0 })
        console.log(err.message)
      }
    }
  }, [ isConnected, provider, address, validatedNearAccId, activationPrice, activator ])

  const handleGetResults = useCallback(async () => {
    const result = await activator.activationInfoOf(validatedNearAccId)
    setActivation(result)
    setNotification({ message: "", status: 0 })
  }, [ activator, validatedNearAccId ])

  const handleRefundClick = useCallback(async () => {
    if(isConnected && validatedNearAccId && activation && Number(activation.status) === 3) {
      try {
        const refundTx = await activator.refund(validatedNearAccId)
        await refundTx.wait()
      } catch(err) {
        console.log(err.message)
      }
    } 
  }, [ isConnected, validatedNearAccId, activation, activator ])

  const handleContinueClick = () => {
    const currentAccountId = validPastedAccountId ? validPastedAccountId : accountId
    const checksummed = ethers.utils.getAddress(address)
    const validAccountId = (isBase58AccountId(currentAccountId)
      ? formatBase58AccountId(currentAccountId)
      : currentAccountId
    )
    if(ethers.utils.isAddress(checksummed) && chain.id === 137 && (selector.isSignedIn() || validPastedAccountId) && validAccountId.length > 0) {
      setDisplayContinue(false)
      setBothWalletsConnected(true)
      setValidatedNearAccId(validAccountId)
    }
  }

  const clearPastedAccountIds = () => {
    setPastedAccountId("")
    setValidPastedAccountId("")
  }

  useEffect(() => {
    if(chain && chain.id !== 137) switchNetwork(137)
  }, [ chain, switchNetwork ])
  
  useEffect(() => {
    if(isConnected && ((selector.isSignedIn() && accountId.length > 0) || (validPastedAccountId && validPastedAccountId.length > 0))) setDisplayContinue(true)
    else setDisplayContinue(false)
  }, [ isConnected, selector, accountId, validPastedAccountId ])

  useEffect(() => {
    if(isConnected && signer) {
      getPrice()
    }
  }, [ isConnected, signer, getPrice ])

  useEffect(() => {
    if(pastedAccountId.length === 44 && isBase58AccountId(pastedAccountId)) {
      console.log(`${ pastedAccountId } is a valid base58 account id`)
      setValidPastedAccountId(formatBase58AccountId(pastedAccountId))
    } else if(pastedAccountId.length === 64 && isHexAccountId(pastedAccountId)) {
      console.log(`${ pastedAccountId } is a valid hex account id`)
      setValidPastedAccountId(pastedAccountId)
    // } else if(pastedAccountId.length > 5 && pastedAccountId.slice(pastedAccountId.length - 5, pastedAccountId.length) === ".near") {
    //   console.log(`${ pastedAccountId } is a valid .near name`)
    //   // check it exists
    //   console.log(selector)
    //   setValidPastedAccountId(pastedAccountId)
    } else setValidPastedAccountId("")

  }, [ selector, pastedAccountId, formatBase58AccountId ])


  if(bothWalletsConnected) {
    return (
      <AppContainer>
        <MainDisplay>
          <Instruction>Activate NEAR Account</Instruction>
          <PriceRow><PriceTitle>Activation Price</PriceTitle><Price>{ ethers.utils.formatUnits(activationPrice, "ether") } MATIC</Price></PriceRow>
          <WalletBlock height={ displayActivate() ? 85 : 40 }>
            <WalletButton onClick={ handleActivateClick } inactive={ !(displayActivate()) } invertBg={ true }>Activate</WalletButton>
            <WalletButton onClick={ handleGetResults }>Get Result</WalletButton>
          </WalletBlock>
           {
            activation
              ? <>
                  <StatusBox>
                    <StatusRow><div style={{ marginRight: "10px" }}>Activator Address:</div><WalletHighlight>{ formatEvmAddr(activation.publicKey) }</WalletHighlight></StatusRow>
                    <StatusRow>{ getStatusCode(activation.status) }</StatusRow>
                  </StatusBox>
                </>
              : ""
          }
          <RefundButton onClick={ handleRefundClick } active={ activation && Number(activation.status) === 3 }>Refund</RefundButton>
          {
            notification.message && (!activation || (activation && Number(activation.status) !== 3))
              ? <Notification status={ notification.status }>{ notification.message }</Notification>
              : ""
          }
        </MainDisplay>
      </AppContainer>
    )
  }


  return (
    <AppContainer>
      <MainDisplay>
        {
          isConnected && connector
            ? <>
                <Instruction>EVM Wallet Connected to { connector.name } <WalletHighlight>{ formatEvmAddr(address) }</WalletHighlight></Instruction>
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
            selector.isSignedIn() || validPastedAccountId
              ? <>
                  <Instruction>NEAR Wallet Connected to <WalletHighlight>{ validPastedAccountId ? formatNearAddr(validPastedAccountId) : formatNearAddr(accountId) }</WalletHighlight></Instruction>
                  <WalletButton onClick={ () => validPastedAccountId ? clearPastedAccountIds() : disconnectNear()}>{ validPastedAccountId ? "Clear" : "Disconnect" }</WalletButton>
                </>
              : <>
                  <Instruction>Connect NEAR Wallet</Instruction>
                  <WalletButton onClick={ handleSignIn }>Choose Wallet</WalletButton>
                  <NearWalletInput spellCheck={ false } placeholder={ "... or paste NEAR hex account ID here" } value={ pastedAccountId } onChange={ (e) => setPastedAccountId(e.target.value) }/>
                </>
          }

          <WalletButton onClick={ handleContinueClick } inactive={ !displayContinue } margin={ 10 } invertBg={ true }>Continue</WalletButton>
      </MainDisplay>
    </AppContainer>
  )
}

export default App