import React, { useContext } from 'react'
import './Cart.css'
import { StoreContext } from '../../context/StoreContext'
import { useNavigate } from 'react-router-dom'

const Cart = ({setShowLogin}) => {
  const {
    cartItems,
    food_list,
    removeFromCart,
    getTotalCartAmount,
    url
    
  } = useContext(StoreContext)

  const navigate = useNavigate()

  const handleCheckout = () => {
    const token = localStorage.getItem('token')

    if (!token) {
      setShowLogin(true)
      return
    }

    navigate('/order')
  }

  return (
    <div className='cart'>
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />

        {food_list.map((item) => {
          if (cartItems[item._id] > 0) {
            return (
              <div key={item._id}>
                <div className="cart-items-title cart-items-item">
                  <img src={url + "/images/" + item.image} alt="" />
                  <p>{item.name}</p>
                  <p>RS {item.price}</p>
                  <p>{cartItems[item._id]}</p>
                  <p>RS {item.price * cartItems[item._id]}</p>
                  <p className='cross' onClick={() => removeFromCart(item._id)}>X</p>
                </div>
                <hr />
              </div>
            )
          }
          return null
        })}
      </div>

      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>

          <div className="cart-total-details">
            <p>Subtotal</p>
            <p>RS {getTotalCartAmount()}</p>
          </div>
          <hr />

          <div className="cart-total-details">
            <p>Delivery Fee</p>
            <p>RS {getTotalCartAmount() === 0 ? 0 : 50}</p>
          </div>
          <hr />

          <div className="cart-total-details">
            <b>Total</b>
            <b>
              RS {getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 50}
            </b>
          </div>

          <button onClick={handleCheckout}>
            PROCEED TO CHECKOUT
          </button>
        </div>

        <div className="cart-promocode">
          <p>If you have a promo code, enter it here</p>
          <div className="cart-promocode-input">
            <input type="text" placeholder='promo code' />
            <button>Submit</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
