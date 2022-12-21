
import { useState, useCallback, useEffect } from "react"
import styled from "styled-components"
import { useAccount, useConnect, useDisconnect } from "wagmi"


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



function App() {

  const connectorsNear = [ { name: "Sender Wallet" } ]

  const [ displayContinue, setDisplayContinue ] = useState(false)
  const [ nearWallet, setNearWallet ] = useState({ name: "", address: "", isConnected: false })

  const { address, connector, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const disconnectNear = useCallback(async () => {
    if(nearWallet.isConnected) {
      if(nearWallet.name === "Sender Wallet") {
        window.near.signOut()
      }
    }
  }, [ nearWallet ])

  const disconnectEvm = useCallback(async () => {
    disconnect()
  }, [ disconnect ])

  const handleEvm = useCallback((c) => {
    connect({ connector: c })
  }, [ connect ])

  const handleSender = useCallback(async ({ c }) => {
    if(c.name === "Sender Wallet") {
      try {
        await window.near.requestSignIn({ contractId: "guest-book.testnet" })
        const accountId = window.near.getAccountId()
        setNearWallet({ name: "Sender Wallet", address: accountId, isConnected: true })
      } catch(err) {
        setNearWallet({ name: "", address: "", isConnected: false })
      }
    }
  }, [])

  
  useEffect(() => {
    if(isConnected && nearWallet.isConnected) setDisplayContinue(true)
    else setDisplayContinue(false)
  }, [ isConnected, nearWallet ])


  return (
    <AppContainer>
      <MainDisplay>
        {
          isConnected && connector
            ? <>
                <Instruction>Connected to { connector.name } { (address).slice(0, 7) }...{ (address).slice(39, 42) }</Instruction>
                <WalletButton onClick={ disconnectEvm }>Disconnect</WalletButton>
              </>
            : <>
                <Instruction>Connect EVM Wallet to Polygon:</Instruction>
                <WalletBlock height={ 126 }>
                  {
                    connectors.map((c) => (
                      <WalletButton key={ c.id } onClick={ () => handleEvm(c) }>
                        { c.name }
                      </WalletButton>
                    ))
                  }
                </WalletBlock>
              </>
          }

          {
            nearWallet.isConnected
            ? <>
                <Instruction>Connected to { nearWallet.name } { (nearWallet.address).slice(0, 5) }...{ (nearWallet.address).slice(61, 64) }</Instruction>
                <WalletButton onClick={ disconnectNear }>Disconnect</WalletButton>
              </>
            : <>
                <Instruction>Connect NEAR Wallet:</Instruction>
                <WalletBlock height={ 40 }>
                  {
                    connectorsNear.map((c) => (
                      <WalletButton key={ c.name } onClick={ () => handleSender({ c }) }>
                        { c.name }
                      </WalletButton>
                    ))
                  }
                </WalletBlock>
              </>
          }

          <WalletButton inactive={ !displayContinue } margin={ 10 } invertBg={ true }>Continue</WalletButton>
      </MainDisplay>
    </AppContainer>
  )
}

export default App
