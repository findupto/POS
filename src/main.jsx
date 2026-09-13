import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as I from 'lucide-react';
import './styles.css';

const defaults = {
  companyName: 'MK Pizza & Ice Bar',
  address: 'Collage Road Abbas Chowk Bhakkar Punjab Pakistan',
  phone: '03169700025',
  taxRate: 0,
  currency: 'Rs',
  developer: 'Aamir Hayyat Malik',
  developerPhone: '03331623862',
  receiptPrinter: '',
  a4Printer: ''
};
const products = [
  [1, 'Crispy Chicken Burger', 'Burgers', 590, '🍔'],
  [2, 'Classic Beef Burger', 'Burgers', 690, '🍔'],
  [3, 'Loaded Fries', 'Sides', 390, '🍟'],
  [4, 'Spicy Wings', 'Sides', 520, '🍗'],
  [5, 'Signature Cola', 'Drinks', 180, '🥤'],
  [6, 'Fresh Lemonade', 'Drinks', 240, '🍋'],
  [7, 'Chocolate Shake', 'Drinks', 450, '🥤'],
  [8, 'Family Combo', 'Combos', 1890, '✨'],
  [9, 'Breakfast Wrap', 'Breakfast', 490, '🌯'],
  [10, 'Mini Donuts', 'Desserts', 290, '🍩']
].map(([id, name, cat, price, emoji]) => ({ id, name, cat, price, emoji }));
const moduleList = [
  ['pos', 'Point of Sale', I.ShoppingCart], ['kds', 'Kitchen Display', I.Layers3],
  ['menu', 'Menu & Combos', I.Sparkles], ['inventory', 'Inventory', I.Boxes],
  ['customers', 'Customers & Loyalty', I.Users], ['suppliers', 'Suppliers & POs', I.Truck],
  ['expenses', 'Expenses & Ledger', I.ReceiptText], ['staff', 'Staff & Payroll', I.BadgeCheck],
  ['analytics', 'Analytics', I.ChartNoAxesCombined], ['audit', 'Audit & Security', I.ShieldCheck],
  ['settings', 'Settings', I.Settings]
];
const seedOrders = [
  { no: '#10482', type: 'Dine-in', items: '2 × Crispy Chicken Burger', total: 1180, status: 'READY', age: 64 },
  { no: '#10483', type: 'Takeout', items: 'Family Combo + Cola', total: 2070, status: 'IN_KITCHEN', age: 148 },
  { no: '#10484', type: 'Drive-thru', items: 'Beef Burger + Fries', total: 1080, status: 'PENDING', age: 32 },
  { no: '#10485', type: 'Delivery', items: '2 × Wings + Lemonade', total: 1280, status: 'READY', age: 224 }
];

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch { return fallback; }
};
const money = (n, currency = 'Rs') => `${currency} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function App() {
  const [module, setModule] = useState('pos');
  const [settings, setSettings] = useState(() => ({ ...defaults, ...read('pos-settings', {}) }));
  const [items] = useState(products);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState(seedOrders);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [discount, setDiscount] = useState(0);
  const [toast, setToast] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [command, setCommand] = useState(false);

  useEffect(() => localStorage.setItem('pos-settings', JSON.stringify(settings)), [settings]);
  useEffect(() => {
    const on = () => setOnline(true); const off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  useEffect(() => {
    const key = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCommand(v => !v); }
      if (e.key === '/' && !command) { e.preventDefault(); setCommand(true); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [command]);

  const categories = useMemo(() => ['All', ...new Set(items.map(x => x.cat))], [items]);
  const visible = items.filter(x => (category === 'All' || x.cat === category) && x.name.toLowerCase().includes(query.toLowerCase()));
  const subtotal = cart.reduce((sum, x) => sum + x.price * x.qty, 0);
  const tax = Math.max(0, (subtotal - discount) * (Number(settings.taxRate) || 0) / 100);
  const total = Math.max(0, subtotal - discount + tax);
  const notify = text => { setToast(text); setTimeout(() => setToast(''), 1500); };
  const add = item => {
    setCart(current => current.some(x => x.id === item.id) ? current.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x) : [...current, { ...item, qty: 1 }]);
    notify(`${item.name} added`);
  };
  const qty = (id, delta) => setCart(current => current.flatMap(x => x.id === id ? (x.qty + delta > 0 ? [{ ...x, qty: x.qty + delta }] : []) : [x]));
  const pay = method => {
    if (!cart.length) return;
    const no = `#${10486 + orders.length}`;
    setOrders(current => [{ no, type: 'Takeout', items: cart.map(x => `${x.qty} × ${x.name}`).join(', '), total: Math.round(total), status: 'PENDING', age: 0, method }, ...current]);
    setCart([]); setDiscount(0); notify(`${method} payment accepted · ${no}`);
  };

  if (new URLSearchParams(location.search).get('display') === 'customer') return <Customer cart={cart} total={total} settings={settings}/>;

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="brandMark">F</div><div><b>Findupto</b><span>POS PRO</span></div></div>
      <div className="store"><div className="storeDot"/><div><strong>{settings.companyName}</strong><small>Bhakkar · POS Terminal</small></div></div>
      <nav>{moduleList.map(([id, label, Icon]) => <button key={id} className={module === id ? 'active' : ''} onClick={() => { setModule(id); setCart([]); }}><Icon size={18}/><span>{label}</span>{id === 'kds' && <em>4</em>}</button>)}</nav>
      <div className="sideBottom"><div className="sync"><span className={online ? 'live' : 'offline'}/><div><b>{online ? 'Cloud synced' : 'Offline mode'}</b><small>{online ? 'All systems operational' : 'Orders queued locally'}</small></div></div><button className="userBtn"><div className="avatar">AM</div><div><b>Admin Manager</b><small>Administrator</small></div></button></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb"><span>Operations</span><I.ChevronRight size={14}/><b>{moduleList.find(x => x[0] === module)?.[1]}</b></div><div className="topActions"><button className="iconBtn" onClick={() => setCommand(true)}><I.Search size={18}/><kbd>⌘K</kbd></button><div className="date">Tax {settings.taxRate}% · {settings.currency}</div></div></header>
      {module === 'pos' ? <POS items={visible} categories={categories} category={category} setCategory={setCategory} query={query} setQuery={setQuery} cart={cart} add={add} qty={qty} setCart={setCart} subtotal={subtotal} discount={discount} setDiscount={setDiscount} tax={tax} total={total} pay={pay} currency={settings.currency} online={online}/> : module === 'settings' ? <Settings settings={settings} setSettings={setSettings}/> : <Module module={module} orders={orders} setOrders={setOrders} currency={settings.currency}/>} 
    </main>
    {toast && <div className="toast"><I.CheckCircle2 size={17}/>{toast}</div>}
    {command && <Command items={items} orders={orders} close={() => setCommand(false)} jump={setModule} currency={settings.currency}/>} 
  </div>;
}

function POS({ items, categories, category, setCategory, query, setQuery, cart, add, qty, setCart, subtotal, discount, setDiscount, tax, total, pay, currency, online }) {
  return <section className="pos"><div className="pageHead"><div><p className="eyebrow">FAST CHECKOUT</p><h1>New Order</h1></div><div className="orderTools"><button><I.UserRoundPlus size={17}/> Guest</button><button><I.Utensils size={17}/> Takeout</button><span className="offlineBadge"><span className={online ? 'live' : 'offline'}/>{online ? 'LIVE' : 'OFFLINE'}</span></div></div>
    <div className="posGrid"><div className="catalog"><div className="search"><I.Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search menu, SKU or barcode…"/><kbd>/</kbd></div><div className="chips">{categories.map(c => <button key={c} onClick={() => setCategory(c)} className={category === c ? 'selected' : ''}>{c}</button>)}</div><div className="products">{items.map(item => <button className="product" key={item.id} onClick={() => add(item)}><div className="productPic">{item.emoji}<span>+</span></div><div className="productInfo"><b>{item.name}</b><small>{item.cat} · SKU-{String(item.id).padStart(4, '0')}</small><strong>{money(item.price, currency)}</strong></div></button>)}</div></div>
      <aside className="ticket"><div className="ticketHead"><div><p className="eyebrow">CURRENT TICKET</p><h2>New Order</h2></div><button className="clear" onClick={() => setCart([])}>Clear</button></div>{cart.length === 0 ? <div className="empty"><div className="emptyIcon"><I.ShoppingBag size={24}/></div><b>Ready for your order</b><span>Tap a menu item to start</span></div> : <div className="ticketItems">{cart.map(item => <div className="ticketItem" key={item.id}><div><b>{item.name}</b><small>{money(item.price, currency)} each</small></div><div className="qty"><button onClick={() => qty(item.id, -1)}>−</button><span>{item.qty}</span><button onClick={() => qty(item.id, 1)}>+</button></div><strong>{money(item.price * item.qty, currency)}</strong></div>)}</div>}<div className="ticketBottom"><div className="totals"><span>Subtotal <b>{money(subtotal, currency)}</b></span><span>Discount <button className="discountBtn" onClick={() => setDiscount(discount ? 0 : Math.round(subtotal * .1))}>{discount ? 'Remove' : 'Add 10%'}</button><b>− {money(discount, currency)}</b></span><span>Tax <b>{money(tax, currency)}</b></span><div className="grand"><span>Total</span><strong>{money(total, currency)}</strong></div></div><div className="payGrid"><button disabled={!cart.length} onClick={() => pay('Cash')}><I.Banknote/>Cash <small>F1</small></button><button disabled={!cart.length} onClick={() => pay('Card')}><I.CreditCard/>Card <small>F2</small></button><button disabled={!cart.length} onClick={() => pay('QR')}><I.QrCode/>QR</button><button disabled={!cart.length} onClick={() => pay('Split')}><I.Columns2/>Split</button></div></div></aside></div></section>;
}

function Settings({ settings, setSettings }) {
  const [printers, setPrinters] = useState([]);
  const discover = async () => { try { const list = window.posDesktop && window.posDesktop.getPrinters ? await window.posDesktop.getPrinters() : []; setPrinters(list || []); } catch { setPrinters([]); } };
  useEffect(() => { discover(); }, []);
  const update = (key, value) => setSettings(current => ({ ...current, [key]: value }));
  return <section className="module"><div className="pageHead"><div><p className="eyebrow">BUSINESS CONTROL</p><h1>Company & Hardware Settings</h1><p className="sub">Everything below is changeable by an administrator.</p></div><button className="primary" onClick={() => localStorage.setItem('pos-settings', JSON.stringify(settings))}><I.Save size={17}/>Save Settings</button></div><div className="settingsGrid"><div className="settingsCard"><div className="settingsTitle"><I.Store size={19}/><div><h3>Company Profile</h3><span>Printed on receipts, reports and accounts</span></div></div><label>Company Name<input value={settings.companyName} onChange={e => update('companyName', e.target.value)}/></label><label>Address<textarea value={settings.address} onChange={e => update('address', e.target.value)}/></label><label>Phone<input value={settings.phone} onChange={e => update('phone', e.target.value)}/></label><div className="two"><label>Tax Rate %<input type="number" value={settings.taxRate} onChange={e => update('taxRate', e.target.value)}/></label><label>Currency<input value={settings.currency} onChange={e => update('currency', e.target.value)}/></label></div></div><div className="settingsCard"><div className="settingsTitle"><I.Printer size={19}/><div><h3>Printing & Hardware</h3><span>Windows printer discovery</span></div><button className="filter" onClick={discover}><I.RefreshCw size={15}/>Discover</button></div><label>80mm Sales Receipt Printer<select value={settings.receiptPrinter} onChange={e => update('receiptPrinter', e.target.value)}><option value="">System default</option>{printers.map(p => <option key={p.name} value={p.name}>{p.displayName || p.name}</option>)}</select></label><label>A4 History & Accounts Printer<select value={settings.a4Printer} onChange={e => update('a4Printer', e.target.value)}><option value="">System default</option>{printers.map(p => <option key={`a4-${p.name}`} value={p.name}>{p.displayName || p.name}</option>)}</select></label><div className="printerHint"><I.Bluetooth size={17}/><div><b>Bluetooth Thermal Printer</b><span>Pair the 80mm printer in Windows and discover it here.</span></div></div><div className="printerHint"><I.FileText size={17}/><div><b>A4 Reports & Accounts</b><span>History and reports can use the selected A4 printer.</span></div></div></div><div className="settingsCard"><div className="settingsTitle"><I.Code2 size={19}/><div><h3>Developer</h3><span>Application attribution</span></div></div><label>Developer Name<input value={settings.developer} onChange={e => update('developer', e.target.value)}/></label><label>Developer Phone<input value={settings.developerPhone} onChange={e => update('developerPhone', e.target.value)}/></label></div></div></section>;
}

function Module({ module, orders, setOrders, currency }) {
  if (module === 'kds') return <section className="module"><div className="pageHead"><div><p className="eyebrow">CONTROL CENTER</p><h1>Kitchen Display</h1><p className="sub">Live station queue & SLA control</p></div></div><div className="metricRow"><Metric label="Today Sales" value={`${currency} 248,640`} delta="+18.4%"/><Metric label="Orders" value="486" delta="+12.1%"/><Metric label="Avg. Ticket" value={`${currency} 511`} delta="+4.8%"/><Metric label="Gross Margin" value="62.8%" delta="+2.6%"/></div><div className="kdsGrid">{orders.map(order => <article className={`ticketCard ${order.status.toLowerCase()}`} key={order.no}><div className="ticketCardTop"><b>{order.no}</b><span>{order.type}</span></div><div className="timer"><I.Timer size={15}/>{order.age}s</div><h3>{order.items}</h3><button onClick={() => setOrders(current => current.map(x => x.no === order.no ? { ...x, status: 'READY' } : x))}>Mark Ready</button></article>)}</div></section>;
  const title = moduleList.find(x => x[0] === module)?.[1] || 'Module';
  return <section className="module"><div className="pageHead"><div><p className="eyebrow">CONTROL CENTER</p><h1>{title}</h1><p className="sub">Operational control, reporting and management</p></div><button className="primary"><I.Plus size={17}/>Create New</button></div><div className="metricRow"><Metric label="Today Sales" value={`${currency} 248,640`} delta="+18.4%"/><Metric label="Orders" value="486" delta="+12.1%"/><Metric label="Avg. Ticket" value={`${currency} 511`} delta="+4.8%"/><Metric label="Gross Margin" value="62.8%" delta="+2.6%"/></div><div className="genericPanel"><div className="insights"><h3>{title} is ready</h3><p>Use this module to manage your QSR operation. Data remains available while the POS is offline.</p><div className="insight"><I.Sparkles size={16}/><span>Premium offline-first workspace enabled.</span></div><div className="insight"><I.ShieldCheck size={16}/><span>Administrative controls are available from Settings.</span></div></div></div></section>;
}
function Metric({ label, value, delta }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small><I.TrendingUp size={13}/>{delta} vs last period</small></div>; }
function Customer({ cart, total, settings }) { return <div className="customerDisplay"><div className="cdBrand"><div className="brandMark">F</div><b>{settings.companyName}</b></div><div className="cdCenter"><span>THANK YOU FOR CHOOSING US</span><h1>Your order is being prepared</h1><div className="cdItems">{cart.length ? cart.map(x => <div key={x.id}><span>{x.qty} × {x.name}</span><b>{money(x.price * x.qty, settings.currency)}</b></div>) : <p>Your items will appear here</p>}</div></div><div className="cdTotal"><span>Total</span><strong>{money(total, settings.currency)}</strong><small>{settings.phone} · We appreciate your visit</small></div></div>; }
function Command({ items, orders, close, jump, currency }) { const [q, setQ] = useState(''); const results = [...items.map(x => ({ title: x.name, sub: `Menu · ${money(x.price, currency)}`, target: 'pos' })), ...orders.map(x => ({ title: x.no, sub: `Order · ${x.status}`, target: 'kds' }))].filter(x => x.title.toLowerCase().includes(q.toLowerCase())).slice(0, 8); return <div className="overlay" onMouseDown={close}><div className="command" onMouseDown={e => e.stopPropagation()}><div className="commandSearch"><I.Search/><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search anything…"/></div><div className="commandResults">{results.map((x, i) => <button key={i} onClick={() => { close(); jump(x.target); }}><I.ArrowUpRight/><div><b>{x.title}</b><span>{x.sub}</span></div></button>)}</div></div></div>; }

createRoot(document.getElementById('root')).render(<App />);
