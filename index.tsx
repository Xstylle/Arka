import React, { useState, useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import {
  Home,
  Search,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Heart,
  MessageSquare,
  User,
  PlusCircle,
  LogOut,
  Menu,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Filter,
  Send,
  Building2,
  DollarSign,
  Star,
  Sparkles,
  Image as ImageIcon
} from "lucide-react";

// --- Types & Interfaces ---

type UserType = "buyer" | "seller";

interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  avatar?: string;
}

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  location: string;
  type: "Apartment" | "House" | "Villa" | "Commercial";
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  amenities: string[];
  sellerId: string;
  featured?: boolean;
  furnishing: "Fully" | "Semi" | "Unfurnished";
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  read: boolean;
}

interface Chat {
  id: string;
  propertyId: string;
  buyerId: string;
  sellerId: string;
  messages: Message[];
  lastUpdated: number;
}

// --- Mock Data ---

const MOCK_USER_SELLER: User = {
  id: "seller1",
  name: "James Wilson",
  email: "james@luxe.com",
  type: "seller",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
};

const MOCK_USER_BUYER: User = {
  id: "buyer1",
  name: "Sarah Jenkins",
  email: "sarah@gmail.com",
  type: "buyer",
  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
};

const MOCK_PROPERTIES: Property[] = [
  {
    id: "p1",
    title: "Modern Waterfront Villa",
    description: "Experience luxury living in this stunning waterfront villa. Featuring floor-to-ceiling windows, a private infinity pool, and smart home integration. Perfect for those who appreciate modern architecture and serene views.",
    price: 2500000,
    city: "Miami",
    location: "South Beach",
    type: "Villa",
    bedrooms: 5,
    bathrooms: 4,
    area: 4500,
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1600",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1600",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1600"
    ],
    amenities: ["Pool", "Gym", "Smart Home", "Waterfront", "Garage"],
    sellerId: "seller1",
    featured: true,
    furnishing: "Fully"
  },
  {
    id: "p2",
    title: "Downtown Penthouse Suite",
    description: "A breathtaking penthouse in the heart of the city. Enjoy panoramic skyline views, high-end appliances, and exclusive access to the building's rooftop lounge and spa.",
    price: 1200000,
    city: "New York",
    location: "Manhattan",
    type: "Apartment",
    bedrooms: 3,
    bathrooms: 3,
    area: 2200,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1600",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1600"
    ],
    amenities: ["Concierge", "Rooftop", "Gym", "Elevator"],
    sellerId: "seller2",
    featured: true,
    furnishing: "Fully"
  },
  {
    id: "p3",
    title: "Cozy Suburban Family Home",
    description: "Charming family home nestled in a quiet neighborhood. Features a spacious backyard, renovated kitchen, and close proximity to top-rated schools and parks.",
    price: 850000,
    city: "Austin",
    location: "Hyde Park",
    type: "House",
    bedrooms: 4,
    bathrooms: 3,
    area: 2800,
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1600",
      "https://images.unsplash.com/photo-1484154218962-a1c00207bf9a?auto=format&fit=crop&q=80&w=1600"
    ],
    amenities: ["Garden", "Fireplace", "Garage", "Pet Friendly"],
    sellerId: "seller1",
    featured: false,
    furnishing: "Semi"
  },
  {
    id: "p4",
    title: "Modern Office Space",
    description: "Premium commercial space ready for your business. Open floor plan, abundant natural light, and located in the thriving tech district.",
    price: 1800000,
    city: "San Francisco",
    location: "SOMA",
    type: "Commercial",
    bedrooms: 0,
    bathrooms: 2,
    area: 3000,
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600"
    ],
    amenities: ["Security", "Parking", "Conference Room", "High-speed Internet"],
    sellerId: "seller2",
    featured: false,
    furnishing: "Unfurnished"
  }
];

// --- Helper Functions ---

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
};

// --- Components ---

// 1. Navbar
const Navbar = ({ 
  user, 
  onNavigate, 
  onLogout, 
  onLoginClick 
}: { 
  user: User | null, 
  onNavigate: (page: string) => void, 
  onLogout: () => void,
  onLoginClick: () => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="bg-amber-500 p-2 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold text-slate-900">Luxe<span className="text-amber-500">Estate</span></span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => onNavigate('home')} className="text-slate-600 hover:text-amber-500 font-medium transition">Home</button>
            <button onClick={() => onNavigate('marketplace')} className="text-slate-600 hover:text-amber-500 font-medium transition">Properties</button>
            <button onClick={() => onNavigate('about')} className="text-slate-600 hover:text-amber-500 font-medium transition">About</button>
            
            {user ? (
              <>
                <button onClick={() => onNavigate('dashboard')} className="flex items-center space-x-2 text-slate-600 hover:text-amber-500 font-medium transition">
                  <MessageSquare className="w-5 h-5" />
                  <span>Dashboard</span>
                </button>
                {user.type === 'seller' && (
                  <button 
                    onClick={() => onNavigate('post')} 
                    className="bg-slate-900 text-white px-5 py-2 rounded-full hover:bg-slate-800 transition flex items-center space-x-2 shadow-lg"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>List Property</span>
                  </button>
                )}
                <div className="relative group">
                  <img src={user.avatar || "https://via.placeholder.com/40"} className="w-10 h-10 rounded-full border-2 border-slate-100 object-cover" alt="Profile" />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 hidden group-hover:block border border-slate-100">
                    <div className="px-4 py-2 border-b border-slate-50 text-sm text-slate-500">Signed in as <br/><span className="font-bold text-slate-900">{user.name}</span></div>
                    <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center"><LogOut className="w-4 h-4 mr-2"/> Sign out</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <button onClick={onLoginClick} className="text-slate-900 font-medium hover:text-amber-600">Log in</button>
                <button onClick={onLoginClick} className="bg-amber-500 text-white px-5 py-2.5 rounded-full hover:bg-amber-600 transition shadow-lg shadow-amber-500/30 font-medium">
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-900">
              {isOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 animate-fade-in">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <button onClick={() => { onNavigate('home'); setIsOpen(false); }} className="block w-full text-left px-3 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Home</button>
            <button onClick={() => { onNavigate('marketplace'); setIsOpen(false); }} className="block w-full text-left px-3 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Properties</button>
            {user ? (
              <>
                 <button onClick={() => { onNavigate('dashboard'); setIsOpen(false); }} className="block w-full text-left px-3 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Dashboard</button>
                 {user.type === 'seller' && (
                    <button onClick={() => { onNavigate('post'); setIsOpen(false); }} className="block w-full text-left px-3 py-3 text-base font-medium text-amber-600 hover:bg-amber-50 rounded-lg">List a Property</button>
                 )}
                 <button onClick={() => { onLogout(); setIsOpen(false); }} className="block w-full text-left px-3 py-3 text-base font-medium text-red-500 hover:bg-red-50 rounded-lg">Sign Out</button>
              </>
            ) : (
              <button onClick={() => { onLoginClick(); setIsOpen(false); }} className="block w-full text-left px-3 py-3 text-base font-medium text-amber-600 hover:bg-amber-50 rounded-lg">Log In / Sign Up</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// 2. Hero Section
const Hero = ({ onSearch }: { onSearch: (filters: any) => void }) => {
  const [location, setLocation] = useState("");
  const [type, setType] = useState("all");

  return (
    <div className="relative bg-slate-900 overflow-hidden">
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1600596542815-37a9a41830e9?auto=format&fit=crop&q=80&w=2000" 
          alt="Hero" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-48 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Find Your Dream Home <br className="hidden md:block"/> in <span className="text-amber-500">Luxury</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl">
          Browse thousands of premium listings. From modern apartments to secluded villas, find the perfect property today.
        </p>

        <div className="w-full max-w-4xl bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="City, Neighborhood, or Address" 
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="flex-1 relative">
            <Home className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <select 
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition appearance-none"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="all">All Property Types</option>
              <option value="House">House</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>
          <button 
            onClick={() => onSearch({ location, type: type === 'all' ? '' : type })}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl transition duration-300 flex items-center justify-center"
          >
            <Search className="w-5 h-5 mr-2" />
            Search
          </button>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/80">
          <div className="flex items-center"><Check className="w-5 h-5 text-amber-500 mr-2" /> Verified Listings</div>
          <div className="flex items-center"><Check className="w-5 h-5 text-amber-500 mr-2" /> Direct Owner Chat</div>
          <div className="flex items-center"><Check className="w-5 h-5 text-amber-500 mr-2" /> No Hidden Fees</div>
        </div>
      </div>
    </div>
  );
};

// 3. Property Card
const PropertyCard: React.FC<{ property: Property; onClick: () => void }> = ({ property, onClick }) => {
  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-100"
      onClick={onClick}
    >
      <div className="relative h-64 overflow-hidden">
        <img 
          src={property.images[0]} 
          alt={property.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-900 uppercase tracking-wide shadow-sm">
          {property.type}
        </div>
        <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-lg text-white font-bold">
          {formatPrice(property.price)}
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{property.title}</h3>
        </div>
        <div className="flex items-center text-slate-500 text-sm mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          {property.location}, {property.city}
        </div>
        
        <div className="flex justify-between items-center border-t border-slate-100 pt-4 text-slate-600 text-sm">
          <div className="flex items-center gap-1">
            <BedDouble className="w-4 h-4" />
            <span>{property.bedrooms} Beds</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4" />
            <span>{property.bathrooms} Baths</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="w-4 h-4" />
            <span>{property.area} sqft</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Property Details Page
const PropertyDetails = ({ 
  property, 
  onBack, 
  onChat, 
  seller,
  currentUser
}: { 
  property: Property, 
  onBack: () => void, 
  onChat: () => void,
  seller: User | undefined,
  currentUser: User | null
}) => {
  const [activeImage, setActiveImage] = useState(0);

  if (!property) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-900 mb-6 transition">
        <ChevronLeft className="w-5 h-5 mr-1" /> Back to Search
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Images & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg">
              <img src={property.images[activeImage]} alt={property.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {property.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition ${activeImage === idx ? 'border-amber-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Title & Key Specs */}
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{property.title}</h1>
                <div className="flex items-center text-slate-500 text-lg">
                  <MapPin className="w-5 h-5 mr-2 text-amber-500" />
                  {property.location}, {property.city}
                </div>
              </div>
              <div className="text-3xl font-bold text-amber-600">
                {formatPrice(property.price)}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-slate-50 p-4 rounded-xl text-center">
                <div className="text-slate-400 text-sm mb-1">Bedrooms</div>
                <div className="text-xl font-bold text-slate-900 flex justify-center items-center gap-2">
                  <BedDouble className="w-5 h-5 text-slate-700" /> {property.bedrooms}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl text-center">
                <div className="text-slate-400 text-sm mb-1">Bathrooms</div>
                <div className="text-xl font-bold text-slate-900 flex justify-center items-center gap-2">
                  <Bath className="w-5 h-5 text-slate-700" /> {property.bathrooms}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl text-center">
                <div className="text-slate-400 text-sm mb-1">Area</div>
                <div className="text-xl font-bold text-slate-900 flex justify-center items-center gap-2">
                  <Maximize className="w-5 h-5 text-slate-700" /> {property.area} sqft
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl text-center">
                <div className="text-slate-400 text-sm mb-1">Furnishing</div>
                <div className="text-xl font-bold text-slate-900 flex justify-center items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-slate-700" /> {property.furnishing}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-slate-100 pt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">About this property</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities */}
          <div className="border-t border-slate-100 pt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {property.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center text-slate-600 bg-slate-50 px-4 py-3 rounded-lg">
                  <Check className="w-4 h-4 text-amber-500 mr-3" />
                  {amenity}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Contact Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Interested in this property?</h3>
            
            <div className="flex items-center gap-4 mb-6">
              <img src={seller?.avatar || "https://via.placeholder.com/60"} alt="Seller" className="w-16 h-16 rounded-full object-cover border-2 border-amber-100" />
              <div>
                <div className="text-sm text-slate-500">Listed by</div>
                <div className="font-bold text-slate-900 text-lg">{seller?.name || "Property Owner"}</div>
                <div className="text-xs text-amber-600 bg-amber-50 inline-block px-2 py-0.5 rounded mt-1 font-medium">Verified Seller</div>
              </div>
            </div>

            {currentUser?.id !== seller?.id ? (
              <button 
                onClick={onChat}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 mb-3 shadow-lg shadow-slate-900/20"
              >
                <MessageSquare className="w-5 h-5" />
                Chat with Seller
              </button>
            ) : (
               <div className="w-full bg-slate-100 text-slate-500 font-medium py-4 rounded-xl text-center mb-3">
                 You own this property
               </div>
            )}
            
            <button className="w-full border-2 border-slate-200 hover:border-slate-900 text-slate-900 font-bold py-4 rounded-xl transition flex items-center justify-center gap-2">
              <Heart className="w-5 h-5" />
              Save for Later
            </button>

            <div className="mt-6 text-xs text-slate-400 text-center leading-relaxed">
              By clicking chat, you agree to our Terms of Service. Please stay safe when meeting sellers in person.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. Chat System
const ChatSystem = ({ 
  chats, 
  currentUser, 
  onSendMessage, 
  properties,
  users 
}: { 
  chats: Chat[], 
  currentUser: User, 
  onSendMessage: (chatId: string, text: string) => void,
  properties: Property[],
  users: User[]
}) => {
  const [activeChatId, setActiveChatId] = useState<string | null>(chats.length > 0 ? chats[0].id : null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  const getOtherUser = (chat: Chat) => {
    const otherId = chat.buyerId === currentUser.id ? chat.sellerId : chat.buyerId;
    return users.find(u => u.id === otherId);
  };

  const getChatProperty = (chat: Chat) => {
    return properties.find(p => p.id === chat.propertyId);
  };

  const handleSend = () => {
    if (!messageInput.trim() || !activeChatId) return;
    onSendMessage(activeChatId, messageInput);
    setMessageInput("");
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-120px)] mt-6 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex">
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-slate-100 bg-slate-50 flex flex-col">
        <div className="p-6 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No messages yet.</div>
          ) : (
            chats.map(chat => {
              const otherUser = getOtherUser(chat);
              const property = getChatProperty(chat);
              const lastMessage = chat.messages[chat.messages.length - 1];
              
              return (
                <div 
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`p-4 border-b border-slate-100 cursor-pointer transition hover:bg-white ${activeChatId === chat.id ? 'bg-white border-l-4 border-l-amber-500 shadow-sm' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <img src={otherUser?.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-slate-900 truncate">{otherUser?.name}</span>
                        <span className="text-xs text-slate-400">{new Date(lastMessage?.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="text-xs text-amber-600 font-medium truncate mb-1">{property?.title}</div>
                      <div className="text-sm text-slate-500 truncate">{lastMessage?.text || "Start chatting..."}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="w-2/3 flex flex-col bg-white">
        {activeChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <img src={getOtherUser(activeChat)?.avatar} className="w-10 h-10 rounded-full" alt="" />
                <div>
                  <div className="font-bold text-slate-900">{getOtherUser(activeChat)?.name}</div>
                  <div className="text-xs text-green-500 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> Online
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <Home className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-600 truncate max-w-[200px]">
                  {getChatProperty(activeChat)?.title}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {activeChat.messages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${isMe ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}`}>
                      <p className="text-sm">{msg.text}</p>
                      <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2 border border-slate-200 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition">
                <input 
                  type="text" 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder-slate-400 py-2"
                />
                <button 
                  onClick={handleSend}
                  disabled={!messageInput.trim()}
                  className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 6. Post Property Form (with Gemini)
const PostProperty = ({ onCancel, onSubmit }: { onCancel: () => void, onSubmit: (p: any) => void }) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    city: "",
    location: "",
    type: "Apartment",
    bedrooms: "",
    bathrooms: "",
    area: "",
    description: "",
    amenities: "",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600" // Default for demo
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateDescription = async () => {
    if (!formData.title || !formData.type || !formData.city) {
      alert("Please fill in Title, Type and City first.");
      return;
    }
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Write a compelling, professional real estate description (max 150 words) for a ${formData.type} located in ${formData.city}, ${formData.location}. 
      It has ${formData.bedrooms} bedrooms, ${formData.bathrooms} bathrooms, and is ${formData.area} sqft. 
      Key amenities: ${formData.amenities}. 
      Title of listing: ${formData.title}.
      Make it sound luxurious and inviting.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      setFormData(prev => ({ ...prev, description: response.text.trim() }));
    } catch (error) {
      console.error("AI Generation failed", error);
      alert("Failed to generate description. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: Number(formData.price),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      area: Number(formData.area),
      amenities: formData.amenities.split(',').map(s => s.trim()),
      images: [formData.imageUrl]
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">List Your Property</h2>
          <div className="text-sm text-slate-400">Step {step} of 2</div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {step === 1 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Property Title</label>
                  <input required name="title" value={formData.title} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" placeholder="e.g., Luxury Villa with Sea View" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Price ($)</label>
                  <input required type="number" name="price" value={formData.price} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Property Type</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none">
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Villa">Villa</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">City</label>
                  <input required name="city" value={formData.city} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Locality/Address</label>
                  <input required name="location" value={formData.location} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-end mt-8">
                 <button type="button" onClick={() => setStep(2)} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl transition flex items-center">
                   Next Step <ChevronRight className="w-4 h-4 ml-2"/>
                 </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-6">
                 <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Bedrooms</label>
                  <input required type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Bathrooms</label>
                  <input required type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Area (sqft)</label>
                  <input required type="number" name="area" value={formData.area} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
              </div>
              
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Amenities (comma separated)</label>
                  <input name="amenities" value={formData.amenities} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Pool, Gym, Parking..." />
              </div>

              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Image URL (Demo)</label>
                  <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700">Description</label>
                  <button 
                    type="button"
                    onClick={generateDescription}
                    disabled={isGenerating}
                    className="text-xs bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-700 px-3 py-1 rounded-full transition flex items-center gap-1"
                  >
                    {isGenerating ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div> : <Sparkles className="w-3 h-3" />}
                    Generate with AI
                  </button>
                </div>
                <textarea 
                  required 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows={5} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" 
                  placeholder="Enter detailed description..."
                />
              </div>

              <div className="flex justify-between mt-8">
                 <button type="button" onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 font-medium py-3 px-6">
                   Back
                 </button>
                 <div className="flex gap-4">
                   <button type="button" onClick={onCancel} className="text-red-500 hover:bg-red-50 font-bold py-3 px-6 rounded-xl transition">
                     Cancel
                   </button>
                   <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg">
                     Post Property
                   </button>
                 </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

// 7. Main Application Component
const App = () => {
  const [view, setView] = useState("home");
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [filter, setFilter] = useState({ city: "", type: "", budget: "" });
  
  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchesCity = filter.city ? p.city.toLowerCase().includes(filter.city.toLowerCase()) || p.location.toLowerCase().includes(filter.city.toLowerCase()) : true;
      const matchesType = filter.type ? p.type === filter.type : true;
      return matchesCity && matchesType;
    });
  }, [properties, filter]);

  const handlePropertyClick = (id: string) => {
    setSelectedPropertyId(id);
    setView("details");
    window.scrollTo(0, 0);
  };

  const handleChatStart = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const property = properties.find(p => p.id === selectedPropertyId);
    if (!property) return;

    // Check if chat exists
    let chat = chats.find(c => c.propertyId === property.id && c.buyerId === user.id && c.sellerId === property.sellerId);
    
    if (!chat) {
      const newChat: Chat = {
        id: `c${Date.now()}`,
        propertyId: property.id,
        buyerId: user.id,
        sellerId: property.sellerId,
        messages: [],
        lastUpdated: Date.now()
      };
      setChats([...chats, newChat]);
    }
    
    setView("dashboard");
  };

  const handleSendMessage = (chatId: string, text: string) => {
    if (!user) return;
    
    const newMessage: Message = {
      id: `m${Date.now()}`,
      senderId: user.id,
      text,
      timestamp: Date.now(),
      read: false
    };

    setChats(chats.map(c => {
      if (c.id === chatId) {
        return { ...c, messages: [...c.messages, newMessage], lastUpdated: Date.now() };
      }
      return c;
    }));
  };

  const handlePostProperty = (newPropertyData: any) => {
    const newProperty: Property = {
      id: `p${Date.now()}`,
      ...newPropertyData,
      sellerId: user!.id,
      images: newPropertyData.images || ["https://via.placeholder.com/800x600"],
      furnishing: "Semi" // default
    };
    setProperties([newProperty, ...properties]);
    setView("marketplace");
  };

  const login = (type: UserType) => {
    setUser(type === 'seller' ? MOCK_USER_SELLER : MOCK_USER_BUYER);
    setShowAuthModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar 
        user={user} 
        onNavigate={(page) => { setView(page); window.scrollTo(0,0); }} 
        onLogout={() => { setUser(null); setView('home'); }}
        onLoginClick={() => setShowAuthModal(true)}
      />

      {/* Main Content Router */}
      <main>
        {view === "home" && (
          <>
            <Hero onSearch={(f) => { setFilter(f); setView('marketplace'); window.scrollTo(0,0); }} />
            {/* Featured Section */}
            <div className="max-w-7xl mx-auto px-4 py-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Featured Properties</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.filter(p => p.featured).map(p => (
                  <PropertyCard key={p.id} property={p} onClick={() => handlePropertyClick(p.id)} />
                ))}
              </div>
            </div>
            
            {/* Why Choose Us */}
            <div className="bg-white py-16 border-y border-slate-100">
               <div className="max-w-7xl mx-auto px-4">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">Why Choose LuxeEstate</h2>
                    <p className="text-slate-500 mt-2">We provide the most complete and premium real estate experience.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                     <div className="p-6">
                        <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Easy Search</h3>
                        <p className="text-slate-500">Find your dream home in seconds with our advanced search filters.</p>
                     </div>
                     <div className="p-6">
                        <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageSquare className="w-8 h-8 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Direct Chat</h3>
                        <p className="text-slate-500">Connect directly with sellers and landlords. No middlemen.</p>
                     </div>
                     <div className="p-6">
                        <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check className="w-8 h-8 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Verified Listings</h3>
                        <p className="text-slate-500">Every property is verified to ensure you get what you see.</p>
                     </div>
                  </div>
               </div>
            </div>
          </>
        )}

        {view === "marketplace" && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Filters Sidebar */}
              <div className="w-full md:w-64 flex-shrink-0">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 sticky top-24">
                  <div className="flex items-center gap-2 font-bold text-lg mb-6">
                    <Filter className="w-5 h-5 text-amber-500" /> Filters
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                      <input 
                        type="text" 
                        placeholder="City" 
                        value={filter.city}
                        onChange={(e) => setFilter({...filter, city: e.target.value})}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
                      <select 
                        value={filter.type}
                        onChange={(e) => setFilter({...filter, type: e.target.value})}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="">All Types</option>
                        <option value="House">House</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Villa">Villa</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>
                    <button 
                       onClick={() => setFilter({ city: "", type: "", budget: "" })}
                       className="w-full text-slate-500 hover:text-slate-900 text-sm font-medium"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1">
                <div className="mb-6">
                   <h1 className="text-2xl font-bold text-slate-900">Properties for Sale</h1>
                   <p className="text-slate-500">{filteredProperties.length} listings found</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map(p => (
                    <PropertyCard key={p.id} property={p} onClick={() => handlePropertyClick(p.id)} />
                  ))}
                </div>
                {filteredProperties.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-xl border border-slate-100">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">No properties found</h3>
                    <p className="text-slate-500">Try adjusting your filters to see more results.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === "details" && selectedPropertyId && (
          <PropertyDetails 
            property={properties.find(p => p.id === selectedPropertyId)!} 
            onBack={() => setView("marketplace")}
            onChat={handleChatStart}
            seller={user?.type === 'seller' ? MOCK_USER_SELLER : undefined} // Mock logic for demo
            currentUser={user}
          />
        )}

        {view === "post" && (
          <PostProperty onCancel={() => setView('home')} onSubmit={handlePostProperty} />
        )}

        {view === "dashboard" && user && (
          <div className="max-w-7xl mx-auto px-4 py-8">
             <h1 className="text-3xl font-bold text-slate-900 mb-6">Dashboard</h1>
             {user.type === 'seller' && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">My Listings</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {properties.filter(p => p.sellerId === user.id).map(p => (
                      <PropertyCard key={p.id} property={p} onClick={() => handlePropertyClick(p.id)} />
                    ))}
                    <button onClick={() => setView('post')} className="flex flex-col items-center justify-center h-full min-h-[300px] bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl hover:bg-slate-100 transition">
                      <PlusCircle className="w-10 h-10 text-slate-400 mb-2" />
                      <span className="text-slate-600 font-medium">Add New Property</span>
                    </button>
                  </div>
                </div>
             )}
             
             <div>
                <ChatSystem 
                  chats={chats.filter(c => c.buyerId === user.id || c.sellerId === user.id)} 
                  currentUser={user}
                  onSendMessage={handleSendMessage}
                  properties={properties}
                  users={[MOCK_USER_BUYER, MOCK_USER_SELLER]} // In real app this would be a user fetch
                />
             </div>
          </div>
        )}

        {view === "about" && (
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-6">About LuxeEstate</h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              We are the world's leading premium real estate marketplace. Our mission is to connect discerning buyers with exceptional properties and sellers, facilitating seamless, transparent, and direct transactions.
            </p>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                <button onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="space-y-4">
                <button 
                  onClick={() => login('buyer')} 
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:border-amber-500 p-4 rounded-xl transition group"
                >
                   <div className="bg-slate-100 p-2 rounded-full group-hover:bg-amber-50"><User className="w-5 h-5 text-slate-600 group-hover:text-amber-600" /></div>
                   <div className="text-left">
                     <div className="font-bold text-slate-900">Continue as Buyer</div>
                     <div className="text-xs text-slate-500">Browse and chat with sellers</div>
                   </div>
                </button>
                <button 
                  onClick={() => login('seller')} 
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:border-slate-900 p-4 rounded-xl transition group"
                >
                   <div className="bg-slate-100 p-2 rounded-full group-hover:bg-slate-200"><Building2 className="w-5 h-5 text-slate-600 group-hover:text-slate-900" /></div>
                   <div className="text-left">
                     <div className="font-bold text-slate-900">Continue as Seller</div>
                     <div className="text-xs text-slate-500">List properties and manage leads</div>
                   </div>
                </button>
              </div>

              <div className="mt-6 text-center text-sm text-slate-500">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
           <div>
              <div className="flex items-center mb-4">
                <Building2 className="h-6 w-6 text-amber-500 mr-2" />
                <span className="text-xl font-bold">LuxeEstate</span>
              </div>
              <p className="text-slate-400 text-sm">Premium properties, verified sellers, and seamless connections.</p>
           </div>
           <div>
             <h4 className="font-bold mb-4">Quick Links</h4>
             <ul className="space-y-2 text-slate-400 text-sm">
               <li><button onClick={() => setView('home')} className="hover:text-white">Home</button></li>
               <li><button onClick={() => setView('marketplace')} className="hover:text-white">Properties</button></li>
               <li><button onClick={() => setView('about')} className="hover:text-white">About Us</button></li>
             </ul>
           </div>
           <div>
             <h4 className="font-bold mb-4">Support</h4>
             <ul className="space-y-2 text-slate-400 text-sm">
               <li>Help Center</li>
               <li>Terms of Service</li>
               <li>Privacy Policy</li>
             </ul>
           </div>
           <div>
             <h4 className="font-bold mb-4">Newsletter</h4>
             <div className="flex">
               <input type="email" placeholder="Enter your email" className="bg-slate-800 border-none rounded-l-lg px-4 py-2 w-full text-sm outline-none focus:ring-1 focus:ring-amber-500" />
               <button className="bg-amber-500 text-white px-4 py-2 rounded-r-lg hover:bg-amber-600 font-bold">Sub</button>
             </div>
           </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-xs">
          © 2024 LuxeEstate Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);