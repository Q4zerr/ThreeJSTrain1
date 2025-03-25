import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'
import './Burger.css'

const Burger = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleMenu = () => {
        setIsOpen(prevState => !prevState);
    }

  return (
    <header>
        <div className="container">
            <div className="menu-button" onClick={handleMenu}>
                <FontAwesomeIcon icon={faBars} size='xl' />
            </div>
            <div className={`menu ${isOpen ? 'open' : ''}`}>
                <div className="close-button" onClick={handleMenu}>
                    <FontAwesomeIcon icon={faXmark} size='xl'/>
                </div>
                <ul>
                    <li>
                        <Link to="/">Earth & Car</Link>
                    </li>
                    <li>
                        <Link to="/samurai">Samurai</Link>
                    </li>
                </ul>
            </div>
        </div>
    </header>
  )
}

export default Burger