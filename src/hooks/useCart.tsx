import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // const storagedCart = Buscar dados do localStorage

    // if (storagedCart) {
    //   return JSON.parse(storagedCart);
    // }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/products/${productId}`)
      const product = response.data 

      const updatedCart = [...cart] //a lista mais att do cart possivel
      const productExists = updatedCart.find((product) => product.id===productId)// so vai ter quando o produto for add mais de 1x
      console.log('productExists :>>', productExists) 

      const responseAmount =await api.get(`/stock/${productId}`)
      const productStock = responseAmount.data.amount //stock(amount) do produto
      console.log('productStock :>>', productStock) 
      
      if(productExists) { //caso exista
        if(productStock > productExists.amount) { //conferir sua quantidade no estoque
          productExists.amount = productExists.amount + 1 
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
          const newProduct = {
            ...product,
            amount: 1
          }
        setCart([...cart, newProduct])
      }
       
    } catch (error){
      toast.error('Erro na adição do produto');
    }
  };
  
  useEffect(()=> {
    console.log('cart :>>', cart)
  },[cart])

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart]//a lista mais att do cart possivel
      const newCart = updatedCart.filter((product) => { 
        return product.id !== productId //retorna todos menos o productId
      })
      setCart(newCart)
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updatedCart = [...cart]// a lista mais att do cart possivel
      const productExists = updatedCart.find((product) => product.id===productId)
      
      const responseAmount =await api.get(`/stock/${productId}`)
      const productStock = responseAmount.data.amount

      console.log('amount', amount)
      if(productExists){
        if(productStock >= amount && productExists.amount > 0) {
          
          productExists.amount = amount       
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
        setCart(updatedCart)
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
