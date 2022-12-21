
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import reportWebVitals from "./reportWebVitals"

import { createGlobalStyle } from "styled-components"

import { WagmiConfig, createClient, configureChains } from "wagmi"
import { publicProvider } from "wagmi/providers/public"
import { polygon } from "wagmi/chains"

import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet"
import { MetaMaskConnector } from "wagmi/connectors/metaMask"
import { WalletConnectConnector } from "wagmi/connectors/walletConnect"

import { Buffer } from "buffer"
window.Buffer = window.Buffer || Buffer

const GlobalStyle = createGlobalStyle`
  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    font-family: sans-serif;
  }
`


const { chains, provider, webSocketProvider } = configureChains(
  [ polygon ],
  [ publicProvider() ]
)

const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: true,
      }
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: "wagmi",
      }
    })
  ],
  provider,
  webSocketProvider
})

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <GlobalStyle/>
    <WagmiConfig client={ client }>
      <App/>
    </WagmiConfig>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
