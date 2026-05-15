import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, MapPin, Clock, Phone, Mail, User, LogOut, ChefHat, Flame, Fish, Drumstick, Menu as MenuIcon, Shield, Package, CheckCircle2, Truck, Timer, Edit3, Save, Bell, Home, Grid3x3, Users, BarChart3, Search, Filter, Eye, ArrowRight, Star, Heart, Settings, CreditCard, Map, ChevronRight, X, Check } from 'lucide-react';
import supabase from './lib/supabase';
import { signInWithGoogle, handleGoogleRedirect } from './lib/googleAuth';

handleGoogleRedirect();

const SRINAGAR_LOCALITIES = [
  'Lal Chowk', 'Rajbagh', 'Jawahar Nagar', 'Karan Nagar', 'Batamaloo', 'Maisuma',
  'Dal Lake', 'Dalgate', 'Boulevard', 'Nehru Park', 'Sonwar', 'Badami Bagh',
  'Hazratbal', 'Nishat', 'Shalimar', 'Harwan', 'Brein', 'Chashme Shahi',
  'Soura', 'Zadibal', 'Nowshera', 'Buchpora', 'Zakura', 'Habak',
  'Bemina', 'Hyderpora', 'Nowgam', 'Bagh-e-Mehtab', 'Chanapora', 'Natipora',
  'Rainawari', 'Khanyar', 'Nowhatta', 'Habba Kadal', 'Fateh Kadal', 'Zaina Kadal',
  'Downtown', 'Safakadal', 'Nawakadal', 'Bohri Kadal', 'Sheshgari Mohalla',
  'Gogji Bagh', 'Wazir Bagh', 'Tulsi Bagh', 'Sheikh Bagh', 'Polo View',
  'Lal Mandi', 'Residency Road', 'Kothibagh', 'Munawarabad', 'Khumani Chowk',
  'Eidgah', 'Ali Jan Road', 'Qamarwari', 'Parimpora', 'Shalteng',
  'Pantha Chowk', 'Pampore', 'Lasjan', 'Padshahi Bagh', 'Saida Kadal',
  'Ellahi Bagh', 'Mominabad', 'Umer Colony', 'Gousia Colony', 'Bota Kadal'
].sort();

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_available: boolean;
};

type CartItem = Product & { quantity: number };

type Order = {
  id: number;
  user_id: string;
  customer_name: string;
  phone: string;
  email: string;
  delivery_address: string;
  locality: string;
  items: CartItem[];
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  locality: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  orderId?: number;
};

const ORDER_STATUSES = [
  { id: 'Pending', label: 'Order Received', icon: Package, color: '#f59e0b', description: 'We\'ve received your order' },
  { id: 'Confirmed', label: 'Confirmed', icon: CheckCircle2, color: '#3b82f6', description: 'Restaurant confirmed your order' },
  { id: 'Preparing', label: 'Preparing', icon: ChefHat, color: '#8b5cf6', description: 'Chef is cooking your food' },
  { id: 'Out for Delivery', label: 'On the Way', icon: Truck, color: '#06b6d4', description: 'Driver is heading to you' },
  { id: 'Delivered', label: 'Delivered', icon: Check, color: '#10b981', description: 'Enjoy your meal!' },
];

export default function App() {
  const [view, setView] = useState<'home' | 'menu' | 'cart' | 'checkout' | 'account' | 'orders' | 'auth' | 'confirmation' | 'admin'>('home');
  const [accountTab, setAccountTab] = useState<'profile' | 'orders' | 'addresses'>('profile');
  const [products, setProducts] = useState<Product[]>([]);
  const [heroBanners, setHeroBanners] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Auth
  const [isSignUp, setIsSignUp] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  
  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '', locality: '' });
  
  // Checkout
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [orderPlaced, setOrderPlaced] = useState<Order | null>(null);
  
  // Admin
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminCustomers, setAdminCustomers] = useState<any[]>([]);
  const [adminView, setAdminView] = useState<'dashboard' | 'orders' | 'menu' | 'customers' | 'analytics'>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchHeroBanners();
    checkUser();
    
    // Check for admin access via URL
    if (window.location.pathname === '/admin' || window.location.hash === '#admin' || window.location.search.includes('admin')) {
      setView('admin');
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchUserOrders(session.user.id);
        setCustomerName(session.user.user_metadata?.name || '');
        setCustomerEmail(session.user.email || '');
        setCustomerPhone(session.user.user_metadata?.phone || '');
      } else {
        setProfile(null);
        setUserOrders([]);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const savedCart = localStorage.getItem('maaz-cart');
    if (savedCart) setCart(JSON.parse(savedCart));
    
    // Mock notifications
    setNotifications([
      { id: '1', title: 'Order #1245 out for delivery', message: 'Your food is 5 mins away', time: '2 min ago', read: false, orderId: 1245 },
      { id: '2', title: 'Order delivered', message: 'Thanks for ordering!', time: '1 hour ago', read: true },
    ]);
  }, []);

  useEffect(() => {
    localStorage.setItem('maaz-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time order updates
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('orders')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, (payload) => {
        const updatedOrder = payload.new as Order;
        setUserOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
        
        // Add notification
        const statusInfo = ORDER_STATUSES.find(s => s.id === updatedOrder.status);
        if (statusInfo) {
          const notif: Notification = {
            id: Date.now().toString(),
            title: `Order #${updatedOrder.id} ${statusInfo.label}`,
            message: statusInfo.description,
            time: 'now',
            read: false,
            orderId: updatedOrder.id
          };
          setNotifications(prev => [notif, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      fetchProfile(session.user.id);
      fetchUserOrders(session.user.id);
    }
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      setProfileForm({ name: data.name || '', phone: data.phone || '', address: data.address || '', locality: data.locality || '' });
    }
  };

  const fetchUserOrders = async (userId: string) => {
    const res = await fetch(`/api/orders?user_id=${userId}`);
    const data = await res.json();
    setUserOrders(data || []);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data || []);
      setAdminProducts(data || []);
    } catch (err) { console.error(err); }
  };

  const fetchHeroBanners = async () => {
    try {
      const res = await fetch('/api/hero');
      const data = await res.json();
      setHeroBanners(data || []);
    } catch (err) { console.error(err); }
  };

  const fetchAdminData = async () => {
    try {
      const [ordersRes, profilesRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/profiles')
      ]);
      setAdminOrders(await ordersRes.json());
      setAdminCustomers(await profilesRes.json());
    } catch (err) { console.error(err); }
  };

  const updateProfile = async () => {
    if (!user) return;
    await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, ...profileForm, email: user.email })
    });
    fetchProfile(user.id);
    setEditingProfile(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: { data: { name: authName, phone: authPhone } }
        });
        if (error) throw error;
        if (data.user) {
          await fetch('/api/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: data.user.id, name: authName, phone: authPhone, email: authEmail })
          });
        }
        alert('Account created! Please check your email.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
      }
      setView('home');
    } catch (err: any) { alert(err.message); }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });
      if (res.ok) {
        setAdminLoggedIn(true);
        fetchAdminData();
        setAdminView('dashboard');
      } else {
        alert('Invalid credentials');
      }
    } catch (err) { alert('Login failed'); }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty <= 0 ? null : { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const unreadCount = notifications.filter(n => !n.read).length;

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setView('auth'); return; }
    try {
      const orderData = {
        user_id: user.id,
        customer_name: customerName,
        phone: customerPhone,
        email: customerEmail,
        delivery_address: deliveryAddress,
        locality,
        items: cart,
        total_amount: cartTotal
      };
      
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      const order = await res.json();
      setOrderPlaced({ ...order, items: cart });
      setCart([]);
      localStorage.removeItem('maaz-cart');
      setView('confirmation');
      fetchUserOrders(user.id);
    } catch (err) { alert('Failed to place order'); }
  };

  const updateOrderStatus = async (id: number, status: string) => {
    await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    fetchAdminData();
    if (selectedOrder?.id === id) {
      setSelectedOrder({ ...selectedOrder, status });
    }
  };

  const getStatusIndex = (status: string) => ORDER_STATUSES.findIndex(s => s.id === status);

  const filteredAdminOrders = adminOrders.filter(order => {
    const matchesFilter = orderFilter === 'all' || order.status.toLowerCase().replace(/\s+/g, '-') === orderFilter;
    const matchesSearch = !searchQuery || 
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().includes(searchQuery) ||
      order.phone.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-[#8B4513] text-2xl font-serif">Maaz-e-Balai</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#1c1917] font-sans antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-sans { font-family: 'Outfit', sans-serif; }
        * { scrollbar-width: thin; scrollbar-color: #d6d3d1 #faf9f7; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #a8a29e; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#f0ede9]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            <button onClick={() => setView('home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1c1917] flex items-center justify-center">
                <Flame className="w-[18px] h-[18px] text-[#f59e0b]" />
              </div>
              <div className="text-left">
                <h1 className="font-display text-[24px] leading-none font-semibold tracking-tight">Maaz-e-Balai</h1>
                <p className="text-[11px] text-[#a8a29e] mt-0.5 font-medium tracking-widest">SRINAGAR</p>
              </div>
            </button>

            <div className="flex items-center gap-1">
              <button onClick={() => setView('cart')} className="relative p-3 text-[#57534e] hover:text-[#1c1917] rounded-xl transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-[#1c1917] text-white text-[11px] font-medium rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              
              {user && (
                <button onClick={() => { setView('account'); setAccountTab('profile'); }} className="p-2.5 ml-1">
                  <div className="w-8 h-8 rounded-full bg-[#f5f5f4] flex items-center justify-center text-[#57534e] text-[14px] font-medium hover:bg-[#e7e5e4] transition-colors">
                    {(profile?.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* HOME */}
        {view === 'home' && (
          <>
            <section className="relative overflow-hidden">
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#fff7ed] border border-[#fed7aa] rounded-full mb-6">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-pulse" />
                      <span className="text-[12px] font-medium text-[#9a3412] tracking-wide uppercase">Open now • Free delivery within 1km</span>
                    </div>
                    
                    <h1 className="font-display text-[48px] sm:text-[56px] lg:text-[64px] leading-[0.9] tracking-[-0.02em] mb-6">
                      Srinagar's
                      <br />
                      <span className="text-[#78716c]">original</span> street
                      <br />
                      food kart
                    </h1>
                    
                    <p className="text-[17px] leading-relaxed text-[#57534e] max-w-[480px] mb-8">
                      Fresh fish from Dal Lake, chicken marinated 12 hours, momos folded by hand every morning. No shortcuts since 1998.
                    </p>
                    
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => setView('menu')} className="group px-6 h-12 bg-[#1c1917] text-white rounded-xl font-medium text-[15px] hover:bg-[#292524] transition-all flex items-center gap-2">
                        Order now
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <button className="px-6 h-12 bg-white border border-[#e7e5e4] rounded-xl font-medium text-[15px] hover:bg-[#fafaf9] transition-all">
                        View menu
                      </button>
                    </div>

                    <div className="flex items-center gap-6 mt-12 pt-8 border-t border-[#e7e5e4]">
                      {[
                        { label: 'Years', value: '25+' },
                        { label: 'Orders daily', value: '200+' },
                        { label: 'Rating', value: '4.8' },
                      ].map(stat => (
                        <div key={stat.label}>
                          <div className="text-[24px] font-display font-semibold leading-none">{stat.value}</div>
                          <div className="text-[12px] text-[#78716c] mt-1 uppercase tracking-wide">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="aspect-[4/3] rounded-[24px] overflow-hidden bg-[#f5f5f4]">
                      <img src={heroBanners[0]?.image_url || 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl border border-[#e7e5e4] p-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#fff7ed] flex items-center justify-center">
                        <Timer className="w-5 h-5 text-[#ea580c]" />
                      </div>
                      <div>
                        <div className="text-[13px] text-[#78716c]">Avg. delivery</div>
                        <div className="text-[18px] font-semibold leading-none">18 mins</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="font-display text-[32px] leading-tight">Popular right now</h2>
                  <p className="text-[#78716c] mt-1">Fresh off the tawa</p>
                </div>
                <button onClick={() => setView('menu')} className="text-[14px] font-medium text-[#57534e] hover:text-[#1c1917] flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.slice(0, 4).map((product) => (
                  <div key={product.id} className="group bg-white rounded-2xl border border-[#e7e5e4] overflow-hidden hover:shadow-lg hover:border-[#d6d3d1] transition-all">
                    <div className="aspect-[4/3] overflow-hidden bg-[#fafaf9]">
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-medium leading-snug">{product.name}</h3>
                        <span className="text-[15px] font-medium">₹{product.price}</span>
                      </div>
                      <p className="text-[13px] text-[#78716c] line-clamp-2 leading-snug mb-3">{product.description}</p>
                      <button onClick={() => addToCart(product)} className="w-full h-9 bg-[#f5f5f4] hover:bg-[#1c1917] hover:text-white rounded-lg text-[13px] font-medium transition-all">
                        Add to cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* MENU */}
        {view === 'menu' && (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="font-display text-[36px]">Menu</h1>
              <p className="text-[#78716c]">Everything made fresh to order</p>
            </div>

            <div className="grid lg:grid-cols-[240px_1fr] gap-8">
              <aside className="hidden lg:block">
                <div className="sticky top-[88px] space-y-1">
                  {['All', ...Array.from(new Set(products.map(p => p.category)))].map(cat => (
                    <button key={cat} className="w-full text-left px-3 py-2 rounded-lg text-[14px] hover:bg-[#f5f5f4] transition-colors">
                      {cat}
                    </button>
                  ))}
                </div>
              </aside>

              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl border border-[#e7e5e4] overflow-hidden hover:shadow-md transition-all group">
                    <div className="aspect-video bg-[#fafaf9] overflow-hidden">
                      <img src={product.image_url} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{product.name}</h3>
                        <span className="font-medium">₹{product.price}</span>
                      </div>
                      <p className="text-[13px] text-[#78716c] mb-3 line-clamp-2">{product.description}</p>
                      <button onClick={() => addToCart(product)} className="w-full h-9 bg-[#1c1917] text-white rounded-lg text-[13px] font-medium hover:bg-[#292524] transition-colors">
                        Add to cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNT */}
        {view === 'account' && (
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {!user ? (
              <div className="max-w-[420px] mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1c1917] flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="font-display text-[32px] mb-2">Welcome</h1>
                  <p className="text-[#78716c]">Sign in to track orders and save addresses</p>
                </div>

                <div className="bg-white rounded-2xl border border-[#e7e5e4] p-6">
                  <div className="space-y-3">
                    <button onClick={() => setView('auth')} className="w-full h-12 bg-[#1c1917] text-white rounded-xl font-medium hover:bg-[#292524] transition-colors flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      Continue with Email
                    </button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-[#e7e5e4]" /></div>
                      <div className="relative flex justify-center"><span className="px-3 bg-white text-[12px] text-[#a8a29e]">or</span></div>
                    </div>

                    <button onClick={() => signInWithGoogle()} className="w-full h-12 bg-white border border-[#e7e5e4] hover:bg-[#fafaf9] rounded-xl font-medium flex items-center justify-center gap-2.5 transition-colors">
                      <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      Continue with Google
                    </button>
                  </div>

                  <p className="text-center text-[13px] text-[#78716c] mt-6">
                    New here? <button onClick={() => { setView('auth'); setIsSignUp(true); }} className="text-[#1c1917] font-medium hover:underline">Create account</button>
                  </p>
                </div>
              </div>
            ) : (
              <>
            <div className="mb-8">
              <h1 className="font-display text-[32px]">Account</h1>
              <p className="text-[#78716c]">Manage your profile</p>
            </div>

            <div className="grid lg:grid-cols-[240px_1fr] gap-8">
              <aside>
                <div className="bg-white rounded-2xl border border-[#e7e5e4] p-1.5">
                  {[
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'orders', label: 'My Orders', icon: Package },
                    { id: 'addresses', label: 'Addresses', icon: Map },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setAccountTab(tab.id as any)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                        accountTab === tab.id ? 'bg-[#1c1917] text-white' : 'text-[#57534e] hover:bg-[#f5f5f4]'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </aside>

              <div>
                {accountTab === 'profile' && (
                  <div className="bg-white rounded-2xl border border-[#e7e5e4]">
                    <div className="px-6 py-4 border-b border-[#f5f5f4] flex items-center justify-between">
                      <h2 className="font-medium">Personal Information</h2>
                      {!editingProfile ? (
                        <button onClick={() => setEditingProfile(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium hover:bg-[#f5f5f4] rounded-lg transition-colors">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => setEditingProfile(false)} className="px-3 py-1.5 text-[13px] font-medium hover:bg-[#f5f5f4] rounded-lg">Cancel</button>
                          <button onClick={updateProfile} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1917] text-white text-[13px] font-medium rounded-lg">
                            <Save className="w-3.5 h-3.5" /> Save
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-[#1c1917] flex items-center justify-center text-white text-[24px] font-medium">
                          {(profile?.name || user.email || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-[18px]">{profile?.name || 'Add your name'}</div>
                          <div className="text-[14px] text-[#78716c]">{user.email}</div>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5 max-w-[640px]">
                        {[
                          { label: 'Full name', key: 'name', value: profile?.name },
                          { label: 'Phone number', key: 'phone', value: profile?.phone },
                          { label: 'Email', key: 'email', value: user.email, disabled: true },
                          { label: 'Locality', key: 'locality', value: profile?.locality, type: 'select' },
                        ].map(field => (
                          <div key={field.key}>
                            <label className="text-[12px] font-medium text-[#57534e] uppercase tracking-wide">{field.label}</label>
                            {editingProfile && !field.disabled ? (
                              field.type === 'select' ? (
                                <select value={profileForm.locality} onChange={e => setProfileForm({...profileForm, locality: e.target.value})} className="w-full mt-1.5 h-10 px-3 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10 focus:border-[#1c1917]">
                                  <option value="">Select locality</option>
                                  {SRINAGAR_LOCALITIES.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                              ) : (
                                <input value={profileForm[field.key as keyof typeof profileForm] || ''} onChange={e => setProfileForm({...profileForm, [field.key]: e.target.value})} className="w-full mt-1.5 h-10 px-3 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10 focus:border-[#1c1917]" />
                              )
                            ) : (
                              <div className="mt-1.5 h-10 px-3 flex items-center bg-[#fafaf9] border border-transparent rounded-xl text-[14px]">{field.value || '—'}</div>
                            )}
                          </div>
                        ))}
                        <div className="sm:col-span-2">
                          <label className="text-[12px] font-medium text-[#57534e] uppercase tracking-wide">Delivery address</label>
                          {editingProfile ? (
                            <textarea value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} rows={2} className="w-full mt-1.5 px-3 py-2.5 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10 focus:border-[#1c1917] resize-none" />
                          ) : (
                            <div className="mt-1.5 px-3 py-2.5 bg-[#fafaf9] border border-transparent rounded-xl text-[14px] min-h-[60px]">{profile?.address || '—'}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {accountTab === 'orders' && (
                  <div className="space-y-4">
                    {userOrders.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-[#e7e5e4] p-12 text-center">
                        <Package className="w-12 h-12 mx-auto text-[#d6d3d1] mb-3" />
                        <p className="font-medium">No orders yet</p>
                        <p className="text-[14px] text-[#78716c] mt-1">Your order history will appear here</p>
                      </div>
                    ) : (
                      userOrders.map(order => {
                        const statusIndex = getStatusIndex(order.status);
                        const progress = ((statusIndex + 1) / ORDER_STATUSES.length) * 100;
                        
                        return (
                          <div key={order.id} className="bg-white rounded-2xl border border-[#e7e5e4] overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#f5f5f4] flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div>
                                  <div className="flex items-center gap-2.5">
                                    <span className="font-medium">Order #{order.id}</span>
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                                      order.status === 'Delivered' ? 'bg-[#f0fdf4] text-[#15803d]' :
                                      order.status === 'Out for Delivery' ? 'bg-[#ecfeff] text-[#0891b2]' :
                                      'bg-[#fffbeb] text-[#b45309]'
                                    }`}>{order.status}</span>
                                  </div>
                                  <div className="text-[13px] text-[#78716c] mt-0.5">
                                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} • ₹{order.total_amount}
                                  </div>
                                </div>
                              </div>
                              <button className="text-[13px] font-medium text-[#57534e] hover:text-[#1c1917]">View details</button>
                            </div>
                            
                            <div className="px-6 py-5">
                              {/* Progress */}
                              <div className="relative">
                                <div className="absolute top-[15px] left-[15px] right-[15px] h-[2px] bg-[#f5f5f4]">
                                  <div className="h-full bg-[#1c1917] transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                                <div className="relative flex justify-between">
                                  {ORDER_STATUSES.map((status, idx) => {
                                    const isActive = idx <= statusIndex;
                                    const isCurrent = idx === statusIndex;
                                    const Icon = status.icon;
                                    
                                    return (
                                      <div key={status.id} className="flex flex-col items-center gap-2">
                                        <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all ${
                                          isActive ? 'bg-[#1c1917] text-white' : 'bg-white border-2 border-[#e7e5e4] text-[#a8a29e]'
                                        } ${isCurrent ? 'ring-4 ring-[#1c1917]/10' : ''}`}>
                                          <Icon className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="text-center">
                                          <div className={`text-[11px] font-medium ${isActive ? 'text-[#1c1917]' : 'text-[#a8a29e]'}`}>{status.label}</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="mt-6 pt-5 border-t border-[#f5f5f4] flex items-center justify-between">
                                <div className="flex -space-x-2">
                                  {order.items.slice(0, 3).map((item, i) => (
                                    <img key={i} src={item.image_url} alt="" className="w-8 h-8 rounded-lg border-2 border-white object-cover" />
                                  ))}
                                  {order.items.length > 3 && (
                                    <div className="w-8 h-8 rounded-lg border-2 border-white bg-[#f5f5f4] flex items-center justify-center text-[11px] font-medium">
                                      +{order.items.length - 3}
                                    </div>
                                  )}
                                </div>
                                <div className="text-[13px] text-[#78716c]">{order.items.reduce((sum, i) => sum + i.quantity, 0)} items • {order.locality}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {accountTab === 'addresses' && (
                  <div className="bg-white rounded-2xl border border-[#e7e5e4] p-6">
                    <h2 className="font-medium mb-4">Saved Addresses</h2>
                    {profile?.address ? (
                      <div className="p-4 bg-[#fafaf9] rounded-xl border border-[#e7e5e4]">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-[14px] mb-1">Home</div>
                            <div className="text-[13px] text-[#57534e] leading-relaxed">
                              {profile.address}<br />
                              {profile.locality}, Srinagar
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-[#1c1917] text-white text-[10px] font-medium rounded-md uppercase tracking-wide">Default</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[14px] text-[#78716c]">No saved addresses</p>
                    )}
                  </div>
                )}
              </div>
            </div>
              </>
            )}
          </div>
        )}

        {/* CART */}
        {view === 'cart' && (
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="font-display text-[32px] mb-8">Cart</h1>
            
            {cart.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e7e5e4] p-16 text-center">
                <ShoppingCart className="w-12 h-12 mx-auto text-[#d6d3d1] mb-3" />
                <p className="font-medium">Your cart is empty</p>
                <button onClick={() => setView('menu')} className="mt-4 px-5 h-10 bg-[#1c1917] text-white rounded-xl text-[14px] font-medium">Browse menu</button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-[1fr_360px] gap-8">
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="bg-white rounded-2xl border border-[#e7e5e4] p-4 flex gap-4">
                      <img src={item.image_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-[14px] text-[#78716c]">₹{item.price}</p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-lg bg-[#f5f5f4] hover:bg-[#e7e5e4] flex items-center justify-center transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-[14px] font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-lg bg-[#f5f5f4] hover:bg-[#e7e5e4] flex items-center justify-center transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₹{item.price * item.quantity}</div>
                        <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-[12px] text-[#dc2626] hover:underline mt-1">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:sticky lg:top-[88px] h-fit">
                  <div className="bg-white rounded-2xl border border-[#e7e5e4] p-5">
                    <h3 className="font-medium mb-4">Order summary</h3>
                    <div className="space-y-2.5 text-[14px] pb-4 border-b border-[#f5f5f4]">
                      <div className="flex justify-between"><span className="text-[#78716c]">Subtotal</span><span>₹{cartTotal}</span></div>
                      <div className="flex justify-between"><span className="text-[#78716c]">Delivery</span><span className="text-[#059669] font-medium">Free</span></div>
                    </div>
                    <div className="flex justify-between py-4 text-[17px] font-medium">
                      <span>Total</span><span>₹{cartTotal}</span>
                    </div>
                    <button onClick={() => setView('checkout')} className="w-full h-11 bg-[#1c1917] text-white rounded-xl font-medium hover:bg-[#292524] transition-colors">
                      Checkout
                    </button>
                    <p className="text-[12px] text-[#78716c] text-center mt-3">Cash on delivery • Free within 1km</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHECKOUT */}
        {view === 'checkout' && (
          <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="font-display text-[32px] mb-8">Checkout</h1>
            
            <form onSubmit={placeOrder} className="space-y-5">
              <div className="bg-white rounded-2xl border border-[#e7e5e4] p-5">
                <h2 className="font-medium mb-4">Delivery details</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-medium text-[#57534e] uppercase tracking-wide">Name</label>
                    <input required value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full mt-1.5 h-10 px-3 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10" />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[#57534e] uppercase tracking-wide">Phone</label>
                    <input required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full mt-1.5 h-10 px-3 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[12px] font-medium text-[#57534e] uppercase tracking-wide">Locality</label>
                    <select required value={locality} onChange={e => setLocality(e.target.value)} className="w-full mt-1.5 h-10 px-3 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10">
                      <option value="">Select area</option>
                      {SRINAGAR_LOCALITIES.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[12px] font-medium text-[#57534e] uppercase tracking-wide">Full address</label>
                    <textarea required value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} rows={2} className="w-full mt-1.5 px-3 py-2.5 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10 resize-none" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e7e5e4] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Cash on Delivery</h3>
                    <p className="text-[13px] text-[#78716c] mt-0.5">Pay when your food arrives</p>
                  </div>
                  <div className="text-[20px] font-medium">₹{cartTotal}</div>
                </div>
              </div>

              <button type="submit" className="w-full h-12 bg-[#1c1917] text-white rounded-xl font-medium hover:bg-[#292524] transition-colors">
                Place order
              </button>
            </form>
          </div>
        )}

        {/* ADMIN */}
        {view === 'admin' && (
          <div className="min-h-screen bg-[#fafaf9]">
            {!adminLoggedIn ? (
              <div className="max-w-[400px] mx-auto px-6 py-20">
                <div className="text-center mb-8">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#1c1917] flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="font-display text-[28px]">Admin</h1>
                  <p className="text-[#78716c] text-[14px]">Maaz-e-Balai dashboard</p>
                </div>
                <form onSubmit={handleAdminLogin} className="bg-white rounded-2xl border border-[#e7e5e4] p-6 space-y-4">
                  <input required type="email" placeholder="Email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full h-11 px-4 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10" />
                  <input required type="password" placeholder="Password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full h-11 px-4 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10" />
                  <button type="submit" className="w-full h-11 bg-[#1c1917] text-white rounded-xl font-medium">Sign in</button>
                </form>
              </div>
            ) : (
              <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                <aside className="w-[240px] bg-white border-r border-[#e7e5e4] flex flex-col">
                  <div className="h-[68px] flex items-center px-5 border-b border-[#f5f5f4]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#1c1917] flex items-center justify-center">
                        <Flame className="w-4 h-4 text-[#f59e0b]" />
                      </div>
                      <span className="font-display font-semibold">Admin</span>
                    </div>
                  </div>
                  
                  <nav className="flex-1 p-3 space-y-1">
                    {[
                      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                      { id: 'orders', label: 'Orders', icon: Package, count: adminOrders.filter(o => o.status !== 'Delivered').length },
                      { id: 'menu', label: 'Menu', icon: Grid3x3 },
                      { id: 'customers', label: 'Customers', icon: Users },
                    ].map(item => (
                      <button key={item.id} onClick={() => setAdminView(item.id as any)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all ${adminView === item.id ? 'bg-[#1c1917] text-white' : 'text-[#57534e] hover:bg-[#f5f5f4]'}`}>
                        <span className="flex items-center gap-2.5"><item.icon className="w-4 h-4" />{item.label}</span>
                        {item.count ? <span className={`px-1.5 py-0.5 text-[11px] rounded-md ${adminView === item.id ? 'bg-white/20' : 'bg-[#f5f5f4]'}`}>{item.count}</span> : null}
                      </button>
                    ))}
                  </nav>
                  
                  <div className="p-3 border-t border-[#f5f5f4]">
                    <button onClick={() => { setAdminLoggedIn(false); setView('home'); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[14px] font-medium text-[#78716c] hover:bg-[#f5f5f4]"> 
                      <LogOut className="w-4 h-4" />Sign out
                    </button>
                  </div>
                </aside>

                {/* Main */}
                <main className="flex-1 overflow-auto">
                  <div className="h-[68px] bg-white border-b border-[#e7e5e4] flex items-center justify-between px-6">
                    <h1 className="text-[20px] font-medium capitalize">{adminView}</h1>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29e]" />
                        <input placeholder="Search orders..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-[240px] h-9 pl-9 pr-3 bg-[#fafaf9] border border-[#e7e5e4] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10" />
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {adminView === 'dashboard' && (
                      <div className="space-y-6">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {[
                            { label: 'Today\'s orders', value: adminOrders.length, change: '+12%', icon: Package, color: 'text-[#3b82f6]' },
                            { label: 'Preparing', value: adminOrders.filter(o => o.status === 'Preparing').length, change: '3 active', icon: ChefHat, color: 'text-[#8b5cf6]' },
                            { label: 'Out for delivery', value: adminOrders.filter(o => o.status === 'Out for Delivery').length, change: 'On the way', icon: Truck, color: 'text-[#06b6d4]' },
                            { label: 'Revenue', value: `₹${adminOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)}`, change: 'Today', icon: CreditCard, color: 'text-[#10b981]' },
                          ].map(stat => (
                            <div key={stat.label} className="bg-white rounded-2xl border border-[#e7e5e4] p-5">
                              <div className="flex items-start justify-between mb-3">
                                <div className={`w-9 h-9 rounded-xl bg-[#f5f5f4] flex items-center justify-center ${stat.color}`}>
                                  <stat.icon className="w-4.5 h-4.5" />
                                </div>
                                <span className="text-[12px] text-[#059669] font-medium">{stat.change}</span>
                              </div>
                              <div className="text-[26px] font-medium leading-none">{stat.value}</div>
                              <div className="text-[13px] text-[#78716c] mt-1">{stat.label}</div>
                            </div>
                          ))}
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e7e5e4]">
                            <div className="px-5 py-4 border-b border-[#f5f5f4] flex items-center justify-between">
                              <h2 className="font-medium">Live orders</h2>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                                <span className="text-[12px] text-[#78716c]">Live</span>
                              </div>
                            </div>
                            <div className="divide-y divide-[#f5f5f4] max-h-[420px] overflow-auto">
                              {adminOrders.slice(0, 6).map(order => {
                                const statusInfo = ORDER_STATUSES.find(s => s.id === order.status);
                                const Icon = statusInfo?.icon || Package;
                                
                                return (
                                  <div key={order.id} className="px-5 py-4 hover:bg-[#fafaf9] cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${statusInfo?.color}15` }}>
                                          <Icon className="w-5 h-5" style={{ color: statusInfo?.color }} />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-[14px]">#{order.id}</span>
                                            <span className="text-[13px] text-[#57534e]">{order.customer_name}</span>
                                          </div>
                                          <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[12px] text-[#78716c]">{order.locality}</span>
                                            <span className="text-[12px] text-[#78716c]">•</span>
                                            <span className="text-[12px] text-[#78716c]">₹{order.total_amount}</span>
                                            <span className="text-[12px] text-[#78716c]">•</span>
                                            <span className="text-[12px] text-[#78716c]">{new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-[#d6d3d1]" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl border border-[#e7e5e4] p-5">
                            <h2 className="font-medium mb-4">Order status</h2>
                            <div className="space-y-3">
                              {ORDER_STATUSES.map(status => {
                                const count = adminOrders.filter(o => o.status === status.id).length;
                                const percentage = adminOrders.length ? (count / adminOrders.length) * 100 : 0;
                                
                                return (
                                  <div key={status.id}>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                                        <span className="text-[13px]">{status.label}</span>
                                      </div>
                                      <span className="text-[13px] font-medium">{count}</span>
                                    </div>
                                    <div className="h-1.5 bg-[#f5f5f4] rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: status.color }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {adminView === 'orders' && (
                      <div className="bg-white rounded-2xl border border-[#e7e5e4] overflow-hidden">
                        <div className="px-5 py-3 border-b border-[#f5f5f4] flex items-center gap-2 overflow-x-auto">
                          {[
                            { id: 'all', label: 'All orders' },
                            ...ORDER_STATUSES.map(s => ({ id: s.id.toLowerCase().replace(/\s+/g, '-'), label: s.label }))
                          ].map(filter => (
                            <button key={filter.id} onClick={() => setOrderFilter(filter.id)} className={`px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all ${orderFilter === filter.id ? 'bg-[#1c1917] text-white' : 'hover:bg-[#f5f5f4] text-[#57534e]'}`}>
                              {filter.label}
                            </button>
                          ))}
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-[#fafaf9] border-b border-[#f5f5f4]">
                              <tr className="text-left">
                                {['Order', 'Customer', 'Items', 'Amount', 'Status', 'Time', ''].map(h => (
                                  <th key={h} className="px-5 py-3 text-[12px] font-medium text-[#78716c] uppercase tracking-wide">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f5f5f4]">
                              {filteredAdminOrders.map(order => (
                                <tr key={order.id} className="hover:bg-[#fafaf9] cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                  <td className="px-5 py-3.5"><span className="font-medium text-[14px]">#{order.id}</span></td>
                                  <td className="px-5 py-3.5">
                                    <div className="text-[14px]">{order.customer_name}</div>
                                    <div className="text-[12px] text-[#78716c]">{order.phone}</div>
                                  </td>
                                  <td className="px-5 py-3.5 text-[14px]">{order.items?.length || 0} items</td>
                                  <td className="px-5 py-3.5 font-medium text-[14px]">₹{order.total_amount}</td>
                                  <td className="px-5 py-3.5">
                                    <select value={order.status} onChange={e => { e.stopPropagation(); updateOrderStatus(order.id, e.target.value); }} onClick={e => e.stopPropagation()} className="px-2.5 py-1 bg-white border border-[#e7e5e4] rounded-lg text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10">
                                      {ORDER_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                    </select>
                                  </td>
                                  <td className="px-5 py-3.5 text-[13px] text-[#78716c]">{new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                                  <td className="px-5 py-3.5"><ChevronRight className="w-4 h-4 text-[#d6d3d1]" /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {adminView === 'menu' && (
                      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
                        <div className="bg-white rounded-2xl border border-[#e7e5e4]">
                          <div className="px-5 py-4 border-b border-[#f5f5f4]"><h2 className="font-medium">Menu items ({adminProducts.length})</h2></div>
                          <div className="divide-y divide-[#f5f5f4] max-h-[600px] overflow-auto">
                            {adminProducts.map(p => (
                              <div key={p.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-[#fafaf9]">
                                <img src={p.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-[14px]">{p.name}</div>
                                  <div className="text-[12px] text-[#78716c]">{p.category} • ₹{p.price}</div>
                                </div>
                                <div className={`px-2 py-1 rounded-md text-[11px] font-medium ${p.is_available ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-[#f5f5f4] text-[#78716c]'}`}>
                                  {p.is_available ? 'Active' : 'Hidden'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-2xl border border-[#e7e5e4] p-5 h-fit">
                          <h3 className="font-medium mb-4">Add new item</h3>
                          <div className="space-y-3">
                            <input placeholder="Item name" className="w-full h-10 px-3 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10" />
                            <div className="grid grid-cols-2 gap-3">
                              <input placeholder="Price" type="number" className="h-10 px-3 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10" />
                              <select className="h-10 px-3 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10">
                                <option>Fish</option><option>Chicken</option><option>Momo</option><option>BBQ</option>
                              </select>
                            </div>
                            <input placeholder="Image URL" className="w-full h-10 px-3 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10" />
                            <textarea placeholder="Description" rows={2} className="w-full px-3 py-2.5 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10 resize-none" />
                            <button className="w-full h-10 bg-[#1c1917] text-white rounded-xl text-[14px] font-medium">Add item</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {adminView === 'customers' && (
                      <div className="bg-white rounded-2xl border border-[#e7e5e4] overflow-hidden">
                        <div className="px-5 py-4 border-b border-[#f5f5f4]"><h2 className="font-medium">Customers ({adminCustomers.length})</h2></div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-[#fafaf9] border-b border-[#f5f5f4]">
                              <tr className="text-left">
                                {['Customer', 'Contact', 'Locality', 'Orders', 'Joined'].map(h => (
                                  <th key={h} className="px-5 py-3 text-[12px] font-medium text-[#78716c] uppercase tracking-wide">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f5f5f4]">
                              {adminCustomers.map((c, i) => (
                                <tr key={i} className="hover:bg-[#fafaf9]">
                                  <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-[#f5f5f4] flex items-center justify-center text-[13px] font-medium">{(c.name || 'U')[0]}</div>
                                      <span className="text-[14px]">{c.name || '—'}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <div className="text-[13px]">{c.phone || '—'}</div>
                                    <div className="text-[12px] text-[#78716c]">{c.email || ''}</div>
                                  </td>
                                  <td className="px-5 py-3.5 text-[14px]">{c.locality || '—'}</td>
                                  <td className="px-5 py-3.5 text-[14px]">{adminOrders.filter(o => o.user_id === c.id).length}</td>
                                  <td className="px-5 py-3.5 text-[13px] text-[#78716c]">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </main>
              </div>
            )}
          </div>
        )}

        {/* Order Detail Modal */}
        <AnimatePresence>
          {selectedOrder && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
              <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }} onClick={e => e.stopPropagation()} className="w-full max-w-[560px] bg-white rounded-[24px] shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#f5f5f4] flex items-center justify-between">
                  <div>
                    <h2 className="text-[18px] font-medium">Order #{selectedOrder.id}</h2>
                    <p className="text-[13px] text-[#78716c] mt-0.5">{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center hover:bg-[#f5f5f4] rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-6 max-h-[70vh] overflow-auto">
                  {/* Status stepper */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-6">
                      {ORDER_STATUSES.map((status, idx) => {
                        const isActive = getStatusIndex(selectedOrder.status) >= idx;
                        const isCurrent = selectedOrder.status === status.id;
                        
                        return (
                          <div key={status.id} className="flex flex-col items-center gap-2 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-[#1c1917] text-white' : 'bg-[#f5f5f4] text-[#a8a29e]'} ${isCurrent ? 'ring-4 ring-[#1c1917]/10' : ''}`}>
                              <status.icon className="w-4.5 h-4.5" />
                            </div>
                            <span className={`text-[11px] font-medium text-center leading-tight ${isActive ? 'text-[#1c1917]' : 'text-[#a8a29e]'}`}>{status.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="flex gap-2">
                      {ORDER_STATUSES.map(status => (
                        <button key={status.id} onClick={() => updateOrderStatus(selectedOrder.id, status.id)} disabled={selectedOrder.status === status.id} className={`flex-1 py-2 px-3 rounded-xl text-[12px] font-medium transition-all ${selectedOrder.status === status.id ? 'bg-[#1c1917] text-white' : 'bg-[#f5f5f4] hover:bg-[#e7e5e4] text-[#57534e]'}`}>
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <h3 className="text-[12px] font-medium text-[#78716c] uppercase tracking-wide mb-2.5">Customer</h3>
                      <div className="p-4 bg-[#fafaf9] rounded-xl">
                        <div className="font-medium">{selectedOrder.customer_name}</div>
                        <div className="text-[14px] text-[#57534e] mt-1">{selectedOrder.phone} • {selectedOrder.email}</div>
                        <div className="text-[14px] text-[#57534e] mt-1">{selectedOrder.delivery_address}, {selectedOrder.locality}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-[12px] font-medium text-[#78716c] uppercase tracking-wide mb-2.5">Items</h3>
                      <div className="space-y-2">
                        {selectedOrder.items?.map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-[#fafaf9] rounded-xl">
                            <img src={item.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <div className="text-[14px] font-medium truncate">{item.name}</div>
                              <div className="text-[12px] text-[#78716c]">Qty: {item.quantity}</div>
                            </div>
                            <div className="font-medium text-[14px]">₹{item.price * item.quantity}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-[#f5f5f4] flex items-center justify-between">
                      <span className="text-[14px] text-[#78716c]">Total (COD)</span>
                      <span className="text-[20px] font-medium">₹{selectedOrder.total_amount}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AUTH */}
        {view === 'auth' && (
          <div className="max-w-[400px] mx-auto px-6 py-16">
            <div className="text-center mb-8">
              <h1 className="font-display text-[28px] mb-2">{isSignUp ? 'Create account' : 'Welcome back'}</h1>
              <p className="text-[14px] text-[#78716c]">Order faster with an account</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#e7e5e4] p-6">
              <form onSubmit={handleAuth} className="space-y-3.5">
                {isSignUp && (
                  <>
                    <input required placeholder="Full name" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full h-11 px-4 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10" />
                    <input placeholder="Phone (optional)" value={authPhone} onChange={e => setAuthPhone(e.target.value)} className="w-full h-11 px-4 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10" />
                  </>
                )}
                <input required type="email" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full h-11 px-4 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10" />
                <input required type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full h-11 px-4 bg-[#fafaf9] border border-[#e7e5e4] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10" />
                <button type="submit" className="w-full h-11 bg-[#1c1917] text-white rounded-xl font-medium hover:bg-[#292524] transition-colors">
                  {isSignUp ? 'Create account' : 'Sign in'}
                </button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-[#e7e5e4]" /></div>
                <div className="relative flex justify-center"><span className="px-3 bg-white text-[12px] text-[#a8a29e]">or</span></div>
              </div>

              <button onClick={() => signInWithGoogle()} className="w-full h-11 bg-white border border-[#e7e5e4] hover:bg-[#fafaf9] rounded-xl font-medium text-[14px] flex items-center justify-center gap-2 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>

              <p className="text-center text-[13px] mt-5 text-[#78716c]">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-[#1c1917] font-medium hover:underline">{isSignUp ? 'Sign in' : 'Sign up'}</button>
              </p>
            </div>
          </div>
        )}

        {/* CONFIRMATION */}
        {view === 'confirmation' && orderPlaced && (
          <div className="max-w-[520px] mx-auto px-6 py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#f0fdf4] flex items-center justify-center">
              <Check className="w-8 h-8 text-[#15803d]" />
            </div>
            <h1 className="font-display text-[32px] mb-3">Order confirmed</h1>
            <p className="text-[#57534e]">Your order #{orderPlaced.id} is being prepared. We'll notify you at each step.</p>
            
            <div className="mt-8 p-5 bg-white rounded-2xl border border-[#e7e5e4] text-left">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-medium text-[#78716c] uppercase tracking-wide">Order details</span>
                <span className="px-2.5 py-1 bg-[#fffbeb] text-[#b45309] text-[11px] font-medium rounded-full">Preparing</span>
              </div>
              <div className="space-y-2 text-[14px]">
                {orderPlaced.items.map((item, i) => (
                  <div key={i} className="flex justify-between"><span>{item.quantity}× {item.name}</span><span>₹{item.price * item.quantity}</span></div>
                ))}
                <div className="h-px bg-[#f5f5f4] my-3" />
                <div className="flex justify-between font-medium"><span>Total</span><span>₹{orderPlaced.total_amount}</span></div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setView('account'); setAccountTab('orders'); }} className="flex-1 h-11 bg-[#1c1917] text-white rounded-xl font-medium">Track order</button>
              <button onClick={() => setView('home')} className="flex-1 h-11 bg-white border border-[#e7e5e4] rounded-xl font-medium">Continue shopping</button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-xl border-t border-[#e7e5e4]">
        <div className="grid grid-cols-3 h-[64px]">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'menu', icon: Grid3x3, label: 'Menu' },
            { id: 'account', icon: User, label: 'Account' },
          ].map(item => (
            <button key={item.id} onClick={() => setView(item.id as any)} className={`flex flex-col items-center justify-center gap-1 ${view === item.id ? 'text-[#1c1917]' : 'text-[#a8a29e]'}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[11px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}