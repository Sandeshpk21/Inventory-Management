import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import PurchaseOrders from './pages/PurchaseOrders'
import Requirements from './pages/Requirements'
import ToBeOrdered from './pages/ToBeOrdered'
import Stock from './pages/Stock'
import Transactions from './pages/Transactions'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/requirements" element={<Requirements />} />
        <Route path="/to-be-ordered" element={<ToBeOrdered />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/transactions" element={<Transactions />} />
      </Routes>
    </Layout>
  )
}

export default App 