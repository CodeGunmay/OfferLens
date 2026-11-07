"""Synthetic hotel inventory used by the demo seed.

PROVENANCE: Supplier names (Atlas, Meridian, Horizon), property IDs, prices and
rate plans are synthetic demonstration data created for this concept prototype.
They are not TBO inventory and not real supplier records. City geography and
landmark names are real-world anchors used only to exercise geo-blocking.
"""

HOTEL_GROUPS = [
    {
        "code": "HG-1001",
        "canonical_name": "The Grand Imperial, New Delhi",
        "city": "New Delhi",
        "region": "Delhi NCR",
        "address": "Janpath Road, Connaught Place, New Delhi 110001",
        "star_rating": 5.0,
        "latitude": 28.6250,
        "longitude": 77.2195,
        "status": "confirmed",
        "description": (
            "A 5-star heritage-style business hotel on Janpath, walking distance from "
            "Connaught Place, with an outdoor pool, spa and three dining venues."
        ),
        "listings": [
            {
                "supplier": "ATLAS",
                "supplier_property_id": "GP-DEL-10021",
                "name": "Grand Imperial Hotel Delhi",
                "address": "Janpath Road, Connaught Place, New Delhi 110001",
                "latitude": 28.6251,
                "longitude": 77.2193,
                "star_rating": 5.0,
                "amenities": ["Free WiFi", "Outdoor pool", "Spa", "Fitness centre", "Restaurant", "Bar", "Airport transfer", "Business centre"],
                "content_completeness": 92,
                "rooms": [
                    {
                        "room_category": "Deluxe King",
                        "equivalence_class": "deluxe_king",
                        "bed_type": "King bed",
                        "view": "City view",
                        "size_sqm": 32,
                        "occupancy_adults": 2,
                        "max_occupancy": 3,
                        "facilities": ["Free WiFi", "Minibar", "Air conditioning", "Work desk", "Rain shower"],
                        "extraction_note": "Normalized from 'Deluxe Room King Bed'",
                        "rate_plans": [
                            {
                                "base_price": 5000,
                                "meal_plan": "Breakfast",
                                "refundable": True,
                                "cancellation_deadline_hours": 24,
                                "cancellation_policy_note": "Free cancellation until 24 hours before arrival",
                                "payment_terms": "Pay now",
                                "rooms_available": 6,
                            }
                        ],
                    },
                    {
                        "room_category": "Executive Suite",
                        "equivalence_class": "executive_suite",
                        "bed_type": "King bed",
                        "view": "Pool view",
                        "size_sqm": 54,
                        "occupancy_adults": 2,
                        "max_occupancy": 4,
                        "facilities": ["Free WiFi", "Minibar", "Living area", "Club lounge access", "Bathtub"],
                        "extraction_note": "Normalized from 'Suite Executive'",
                        "rate_plans": [
                            {
                                "base_price": 9200,
                                "meal_plan": "Breakfast",
                                "refundable": True,
                                "cancellation_deadline_hours": 48,
                                "cancellation_policy_note": "Free cancellation until 48 hours before arrival",
                                "payment_terms": "Pay now",
                                "rooms_available": 2,
                            }
                        ],
                    },
                ],
            },
            {
                "supplier": "MERIDIAN",
                "supplier_property_id": "MRD-88213",
                "name": "The Grand Imperial New Delhi",
                "address": "Janpath, Connaught Place, New Delhi",
                "latitude": 28.6248,
                "longitude": 77.2201,
                "star_rating": 5.0,
                "amenities": ["WiFi", "Pool", "Spa", "Gym", "Restaurant", "Room service", "Parking"],
                "content_completeness": 74,
                "rooms": [
                    {
                        "room_category": "King Deluxe",
                        "equivalence_class": "deluxe_king",
                        "bed_type": "King bed",
                        "view": "City view",
                        "size_sqm": 30,
                        "occupancy_adults": 2,
                        "max_occupancy": 2,
                        "facilities": ["WiFi", "Minibar", "Air conditioning", "Safe"],
                        "extraction_note": "Bed type and view inferred from supplier text",
                        "rate_plans": [
                            {
                                "base_price": 4500,
                                "meal_plan": "Room only",
                                "refundable": False,
                                "cancellation_deadline_hours": None,
                                "cancellation_policy_note": "Non-refundable at all times",
                                "payment_terms": "Pay now",
                                "rooms_available": 9,
                            }
                        ],
                    },
                    {
                        "room_category": "Suite",
                        "equivalence_class": "executive_suite",
                        "bed_type": "Not specified",
                        "view": "Not specified",
                        "size_sqm": None,
                        "occupancy_adults": 2,
                        "max_occupancy": 3,
                        "facilities": ["WiFi", "Minibar"],
                        "extraction_note": "Room attributes missing from supplier feed",
                        "rate_plans": [
                            {
                                "base_price": 8700,
                                "meal_plan": "Breakfast",
                                "refundable": False,
                                "cancellation_deadline_hours": None,
                                "cancellation_policy_note": "Non-refundable at all times",
                                "payment_terms": "Deposit 20%",
                                "deposit_percent": 20,
                                "rooms_available": 3,
                            }
                        ],
                    },
                ],
            },
            {
                "supplier": "HORIZON",
                "supplier_property_id": "HZN-IN-4471",
                "name": "Grand Imperial, Central Delhi",
                "address": "Janpath Marg, Connaught Place, Central Delhi",
                "latitude": 28.6255,
                "longitude": 77.2188,
                "star_rating": 5.0,
                "amenities": ["Free WiFi", "Swimming pool", "Spa", "Fitness centre", "Restaurant", "Bar", "Concierge", "Room service"],
                "content_completeness": 88,
                "rooms": [
                    {
                        "room_category": "Deluxe King Room",
                        "equivalence_class": "deluxe_king",
                        "bed_type": "King bed",
                        "view": "City view",
                        "size_sqm": 33,
                        "occupancy_adults": 2,
                        "max_occupancy": 3,
                        "facilities": ["Free WiFi", "Minibar", "Air conditioning", "Work desk"],
                        "extraction_note": "Normalized from 'DLX KING'",
                        "rate_plans": [
                            {
                                "base_price": 5200,
                                "meal_plan": "Breakfast",
                                "refundable": True,
                                "cancellation_deadline_hours": 48,
                                "cancellation_policy_note": "Free cancellation until 48 hours before arrival",
                                "payment_terms": "Pay at hotel",
                                "rooms_available": 3,
                            }
                        ],
                    }
                ],
            },
        ],
    },
    {
        "code": "HG-1002",
        "canonical_name": "The Leela Palace, New Delhi",
        "city": "New Delhi",
        "region": "Delhi NCR",
        "address": "Diplomatic Enclave, Chanakyapuri, New Delhi 110023",
        "star_rating": 5.0,
        "latitude": 28.5823,
        "longitude": 77.1876,
        "status": "proposed",
        "description": "Luxury palace-style hotel in Chanakyapuri with landscaped gardens and a large spa.",
        "listings": [
            {
                "supplier": "ATLAS",
                "supplier_property_id": "GP-DEL-10555",
                "name": "The Leela Palace, New Delhi",
                "address": "Diplomatic Enclave, Chanakyapuri, New Delhi 110023",
                "latitude": 28.5823,
                "longitude": 77.1876,
                "star_rating": 5.0,
                "amenities": ["Free WiFi", "Outdoor pool", "Spa", "Fitness centre", "Restaurant", "Bar", "Butler service"],
                "content_completeness": 90,
                "rooms": [
                    {
                        "room_category": "Grand Deluxe King",
                        "equivalence_class": "deluxe_king",
                        "bed_type": "King bed",
                        "view": "Garden view",
                        "size_sqm": 45,
                        "occupancy_adults": 2,
                        "max_occupancy": 3,
                        "facilities": ["Free WiFi", "Minibar", "Butler service", "Nespresso machine"],
                        "extraction_note": "Normalized from supplier room block",
                        "rate_plans": [
                            {
                                "base_price": 14500,
                                "meal_plan": "Breakfast",
                                "refundable": True,
                                "cancellation_deadline_hours": 72,
                                "cancellation_policy_note": "Free cancellation until 72 hours before arrival",
                                "payment_terms": "Pay now",
                                "rooms_available": 4,
                            }
                        ],
                    }
                ],
            },
            {
                "supplier": "HORIZON",
                "supplier_property_id": "HZN-IN-8890",
                "name": "Leela Palace New Delhi - Chanakyapuri",
                "address": "Chanakyapuri, New Delhi",
                "latitude": 28.5831,
                "longitude": 77.1882,
                "star_rating": 5.0,
                "amenities": ["Free WiFi", "Pool", "Spa", "Fitness centre", "Restaurant", "Bar", "Butler service", "Valet parking"],
                "content_completeness": 82,
                "rooms": [
                    {
                        "room_category": "Deluxe Room King",
                        "equivalence_class": "deluxe_king",
                        "bed_type": "King bed",
                        "view": "Garden view",
                        "size_sqm": 44,
                        "occupancy_adults": 2,
                        "max_occupancy": 3,
                        "facilities": ["Free WiFi", "Minibar", "Butler service"],
                        "extraction_note": "Normalized from 'DELUXE KING GDN VIEW'",
                        "rate_plans": [
                            {
                                "base_price": 13900,
                                "meal_plan": "Breakfast",
                                "refundable": True,
                                "cancellation_deadline_hours": 48,
                                "cancellation_policy_note": "Free cancellation until 48 hours before arrival",
                                "payment_terms": "Pay at hotel",
                                "rooms_available": 2,
                            }
                        ],
                    }
                ],
            },
        ],
    },
    {
        "code": "HG-1003",
        "canonical_name": "Taj Palace, New Delhi",
        "city": "New Delhi",
        "region": "Delhi NCR",
        "address": "2 Sardar Patel Marg, Diplomatic Enclave, New Delhi 110021",
        "star_rating": 5.0,
        "latitude": 28.5975,
        "longitude": 77.1720,
        "status": "confirmed",
        "description": "Large 5-star convention hotel on Sardar Patel Marg with extensive banqueting facilities.",
        "listings": [
            {
                "supplier": "ATLAS",
                "supplier_property_id": "GP-DEL-10902",
                "name": "Taj Palace New Delhi",
                "address": "2 Sardar Patel Marg, New Delhi 110021",
                "latitude": 28.5975,
                "longitude": 77.1720,
                "star_rating": 5.0,
                "amenities": ["Free WiFi", "Outdoor pool", "Spa", "Fitness centre", "Restaurant", "Bar", "Business centre"],
                "content_completeness": 94,
                "rooms": [
                    {
                        "room_category": "Superior King",
                        "equivalence_class": "deluxe_king",
                        "bed_type": "King bed",
                        "view": "Garden view",
                        "size_sqm": 38,
                        "occupancy_adults": 2,
                        "max_occupancy": 3,
                        "facilities": ["Free WiFi", "Minibar", "Air conditioning", "Work desk"],
                        "extraction_note": "Normalized from 'Superior Room King'",
                        "rate_plans": [
                            {
                                "base_price": 11200,
                                "meal_plan": "Breakfast",
                                "refundable": True,
                                "cancellation_deadline_hours": 24,
                                "cancellation_policy_note": "Free cancellation until 24 hours before arrival",
                                "payment_terms": "Pay now",
                                "rooms_available": 5,
                            }
                        ],
                    }
                ],
            },
            {
                "supplier": "MERIDIAN",
                "supplier_property_id": "MRD-88921",
                "name": "Taj Palace, Sardar Patel Marg",
                "address": "Sardar Patel Marg, New Delhi",
                "latitude": 28.5971,
                "longitude": 77.1725,
                "star_rating": 5.0,
                "amenities": ["WiFi", "Pool", "Spa", "Gym", "Restaurant", "Bar", "Business centre", "Parking"],
                "content_completeness": 79,
                "rooms": [
                    {
                        "room_category": "Superior Room King",
                        "equivalence_class": "deluxe_king",
                        "bed_type": "King bed",
                        "view": "Garden view",
                        "size_sqm": 36,
                        "occupancy_adults": 2,
                        "max_occupancy": 2,
                        "facilities": ["WiFi", "Minibar", "Air conditioning"],
                        "extraction_note": "Normalized from 'SUP KING'",
                        "rate_plans": [
                            {
                                "base_price": 10450,
                                "meal_plan": "Room only",
                                "refundable": False,
                                "cancellation_deadline_hours": None,
                                "cancellation_policy_note": "Non-refundable at all times",
                                "payment_terms": "Pay now",
                                "rooms_available": 7,
                            }
                        ],
                    }
                ],
            },
            {
                "supplier": "HORIZON",
                "supplier_property_id": "HZN-IN-5512",
                "name": "Taj Palace Hotel Delhi",
                "address": "Sardar Patel Marg, Diplomatic Enclave, New Delhi",
                "latitude": 28.5980,
                "longitude": 77.1712,
                "star_rating": 5.0,
                "amenities": ["Free WiFi", "Outdoor pool", "Spa", "Fitness centre", "Restaurant", "Bar", "Concierge"],
                "content_completeness": 86,
                "rooms": [
                    {
                        "room_category": "Superior King Bed",
                        "equivalence_class": "deluxe_king",
                        "bed_type": "King bed",
                        "view": "Garden view",
                        "size_sqm": 38,
                        "occupancy_adults": 2,
                        "max_occupancy": 3,
                        "facilities": ["Free WiFi", "Minibar", "Air conditioning", "Work desk"],
                        "extraction_note": "Normalized from 'SUPERIOR KING'",
                        "rate_plans": [
                            {
                                "base_price": 11800,
                                "meal_plan": "Breakfast",
                                "refundable": True,
                                "cancellation_deadline_hours": 48,
                                "cancellation_policy_note": "Free cancellation until 48 hours before arrival",
                                "payment_terms": "Pay at hotel",
                                "rooms_available": 3,
                            }
                        ],
                    }
                ],
            },
        ],
    },
    {
        "code": "HG-1004",
        "canonical_name": "ITC Mughal, Agra",
        "city": "Agra",
        "region": "Uttar Pradesh",
        "address": "Taj Ganj, Agra 282001",
        "star_rating": 5.0,
        "latitude": 27.1692,
        "longitude": 78.0403,
        "status": "proposed",
        "description": "Mughal-garden resort hotel in Agra with a large spa and views towards the Taj Mahal.",
        "listings": [
            {
                "supplier": "ATLAS",
                "supplier_property_id": "GP-AGR-20011",
                "name": "ITC Mughal, Agra",
                "address": "Taj Ganj, Agra 282001",
                "latitude": 27.1692,
                "longitude": 78.0403,
                "star_rating": 5.0,
                "amenities": ["Free WiFi", "Outdoor pool", "Spa", "Fitness centre", "Restaurant", "Bar", "Garden"],
                "content_completeness": 88,
                "rooms": [
                    {
                        "room_category": "Mughal King",
                        "equivalence_class": "deluxe_king",
                        "bed_type": "King bed",
                        "view": "Garden view",
                        "size_sqm": 40,
                        "occupancy_adults": 2,
                        "max_occupancy": 3,
                        "facilities": ["Free WiFi", "Minibar", "Air conditioning", "Bathtub"],
                        "extraction_note": "Normalized from 'Mughal Room King Bed'",
                        "rate_plans": [
                            {
                                "base_price": 8600,
                                "meal_plan": "Breakfast",
                                "refundable": True,
                                "cancellation_deadline_hours": 24,
                                "cancellation_policy_note": "Free cancellation until 24 hours before arrival",
                                "payment_terms": "Pay now",
                                "rooms_available": 4,
                            }
                        ],
                    }
                ],
            },
            {
                "supplier": "HORIZON",
                "supplier_property_id": "HZN-IN-7745",
                "name": "ITC Mughal Hotel Agra",
                "address": "Taj Ganj, Agra",
                "latitude": 27.1701,
                "longitude": 78.0411,
                "star_rating": 4.0,
                "amenities": ["Free WiFi", "Pool", "Spa", "Restaurant"],
                "content_completeness": 71,
                "rooms": [
                    {
                        "room_category": "Mughal Room",
                        "equivalence_class": "deluxe_king",
                        "bed_type": "King bed",
                        "view": "Not specified",
                        "size_sqm": None,
                        "occupancy_adults": 2,
                        "max_occupancy": 3,
                        "facilities": ["Free WiFi", "Minibar"],
                        "extraction_note": "Star rating conflict: supplier publishes 4-star",
                        "rate_plans": [
                            {
                                "base_price": 8100,
                                "meal_plan": "Room only",
                                "refundable": True,
                                "cancellation_deadline_hours": 24,
                                "cancellation_policy_note": "Free cancellation until 24 hours before arrival",
                                "payment_terms": "Pay at hotel",
                                "rooms_available": 6,
                            }
                        ],
                    }
                ],
            },
        ],
    },
    {
        "code": "HG-1005",
        "canonical_name": "Hotel Pearl Palace, Jaipur",
        "city": "Jaipur",
        "region": "Rajasthan",
        "address": "Hathroi Fort, Ajmer Road, Jaipur 302001",
        "star_rating": 3.0,
        "latitude": 26.9235,
        "longitude": 75.8080,
        "status": "confirmed",
        "description": "Boutique heritage guest house near Hathroi Fort with a rooftop restaurant.",
        "listings": [
            {
                "supplier": "MERIDIAN",
                "supplier_property_id": "MRD-40118",
                "name": "Hotel Pearl Palace Jaipur",
                "address": "Hathroi Fort, Ajmer Road, Jaipur",
                "latitude": 26.9235,
                "longitude": 75.8080,
                "star_rating": 3.0,
                "amenities": ["Free WiFi", "Rooftop restaurant", "Air conditioning", "Laundry"],
                "content_completeness": 83,
                "rooms": [
                    {
                        "room_category": "Deluxe Double",
                        "equivalence_class": "deluxe_double",
                        "bed_type": "Double bed",
                        "view": "Fort view",
                        "size_sqm": 22,
                        "occupancy_adults": 2,
                        "max_occupancy": 2,
                        "facilities": ["Free WiFi", "Air conditioning", "Private bathroom"],
                        "extraction_note": "Normalized from 'Deluxe Dbl'",
                        "rate_plans": [
                            {
                                "base_price": 2400,
                                "meal_plan": "Breakfast",
                                "refundable": True,
                                "cancellation_deadline_hours": 24,
                                "cancellation_policy_note": "Free cancellation until 24 hours before arrival",
                                "payment_terms": "Pay at hotel",
                                "rooms_available": 5,
                            }
                        ],
                    }
                ],
            },
            {
                "supplier": "HORIZON",
                "supplier_property_id": "HZN-IN-9910",
                "name": "Pearl Palace Hotel, Jaipur",
                "address": "Ajmer Road, Hathroi Fort, Jaipur",
                "latitude": 26.9240,
                "longitude": 75.8086,
                "star_rating": 3.0,
                "amenities": ["Free WiFi", "Rooftop restaurant", "Air conditioning", "Laundry", "Travel desk"],
                "content_completeness": 77,
                "rooms": [
                    {
                        "room_category": "Deluxe Room",
                        "equivalence_class": "deluxe_double",
                        "bed_type": "Double bed",
                        "view": "Fort view",
                        "size_sqm": 21,
                        "occupancy_adults": 2,
                        "max_occupancy": 2,
                        "facilities": ["Free WiFi", "Air conditioning"],
                        "extraction_note": "Normalized from 'DELUXE'",
                        "rate_plans": [
                            {
                                "base_price": 2250,
                                "meal_plan": "Room only",
                                "refundable": False,
                                "cancellation_deadline_hours": None,
                                "cancellation_policy_note": "Non-refundable at all times",
                                "payment_terms": "Pay now",
                                "rooms_available": 8,
                            }
                        ],
                    }
                ],
            },
        ],
    },
    {
        "code": "HG-1006",
        "canonical_name": "The Oberoi, Mumbai",
        "city": "Mumbai",
        "region": "Maharashtra",
        "address": "Nariman Point, Mumbai 400021",
        "star_rating": 5.0,
        "latitude": 18.9269,
        "longitude": 72.8205,
        "status": "confirmed",
        "description": "Waterfront luxury hotel at Nariman Point with sea-facing rooms.",
        "listings": [
            {
                "supplier": "ATLAS",
                "supplier_property_id": "GP-BOM-30001",
                "name": "The Oberoi Mumbai",
                "address": "Nariman Point, Mumbai 400021",
                "latitude": 18.9269,
                "longitude": 72.8205,
                "star_rating": 5.0,
                "amenities": ["Free WiFi", "Outdoor pool", "Spa", "Fitness centre", "Restaurant", "Bar", "Sea view"],
                "content_completeness": 93,
                "rooms": [
                    {
                        "room_category": "Luxury Sea View King",
                        "equivalence_class": "deluxe_king",
                        "bed_type": "King bed",
                        "view": "Sea view",
                        "size_sqm": 42,
                        "occupancy_adults": 2,
                        "max_occupancy": 3,
                        "facilities": ["Free WiFi", "Minibar", "Air conditioning", "Nespresso machine", "Bathtub"],
                        "extraction_note": "Normalized from 'Luxury Room Sea View'",
                        "rate_plans": [
                            {
                                "base_price": 16800,
                                "meal_plan": "Breakfast",
                                "refundable": True,
                                "cancellation_deadline_hours": 48,
                                "cancellation_policy_note": "Free cancellation until 48 hours before arrival",
                                "payment_terms": "Pay now",
                                "rooms_available": 4,
                            }
                        ],
                    }
                ],
            },
            {
                "supplier": "MERIDIAN",
                "supplier_property_id": "MRD-71204",
                "name": "Oberoi Hotel, Nariman Point",
                "address": "Nariman Point, Mumbai",
                "latitude": 18.9274,
                "longitude": 72.8211,
                "star_rating": 5.0,
                "amenities": ["WiFi", "Pool", "Spa", "Gym", "Restaurant", "Bar", "Sea view"],
                "content_completeness": 81,
                "rooms": [
                    {
                        "room_category": "Luxury Room Sea View",
                        "equivalence_class": "deluxe_king",
                        "bed_type": "King bed",
                        "view": "Sea view",
                        "size_sqm": 40,
                        "occupancy_adults": 2,
                        "max_occupancy": 2,
                        "facilities": ["WiFi", "Minibar", "Air conditioning"],
                        "extraction_note": "Normalized from 'LUX SGL/DBL'",
                        "rate_plans": [
                            {
                                "base_price": 15950,
                                "meal_plan": "Room only",
                                "refundable": False,
                                "cancellation_deadline_hours": None,
                                "cancellation_policy_note": "Non-refundable at all times",
                                "payment_terms": "Pay now",
                                "rooms_available": 6,
                            }
                        ],
                    }
                ],
            },
        ],
    },
    {
        "code": "HG-1007",
        "canonical_name": "Radisson Blu Plaza, Delhi Airport",
        "city": "New Delhi",
        "region": "Delhi NCR",
        "address": "National Highway 8, Mahipalpur, New Delhi 110037",
        "star_rating": 5.0,
        "latitude": 28.5448,
        "longitude": 77.1236,
        "status": "proposed",
        "description": "Airport hotel near Terminal 3 with a large conference floor.",
        "listings": [
            {
                "supplier": "MERIDIAN",
                "supplier_property_id": "MRD-60441",
                "name": "Radisson Blu Plaza Delhi Airport",
                "address": "NH-8, Mahipalpur, New Delhi",
                "latitude": 28.5448,
                "longitude": 77.1236,
                "star_rating": 5.0,
                "amenities": ["Free WiFi", "Outdoor pool", "Spa", "Fitness centre", "Restaurant", "Airport transfer"],
                "content_completeness": 86,
                "rooms": [
                    {
                        "room_category": "Superior King",
                        "equivalence_class": "deluxe_king",
                        "bed_type": "King bed",
                        "view": "City view",
                        "size_sqm": 34,
                        "occupancy_adults": 2,
                        "max_occupancy": 3,
                        "facilities": ["Free WiFi", "Minibar", "Air conditioning", "Work desk"],
                        "extraction_note": "Normalized from 'SUPERIOR KING'",
                        "rate_plans": [
                            {
                                "base_price": 7900,
                                "meal_plan": "Breakfast",
                                "refundable": True,
                                "cancellation_deadline_hours": 24,
                                "cancellation_policy_note": "Free cancellation until 24 hours before arrival",
                                "payment_terms": "Pay now",
                                "rooms_available": 5,
                            }
                        ],
                    }
                ],
            },
            {
                "supplier": "HORIZON",
                "supplier_property_id": "HZN-IN-2280",
                "name": "Radisson Blu Plaza Hotel, NH-8 Delhi",
                "address": "Mahipalpur, NH-8, New Delhi",
                "latitude": 28.5455,
                "longitude": 77.1244,
                "star_rating": 5.0,
                "amenities": ["Free WiFi", "Pool", "Spa", "Fitness centre", "Restaurant", "Airport transfer", "Bar"],
                "content_completeness": 80,
                "rooms": [
                    {
                        "room_category": "Superior Room King Bed",
                        "equivalence_class": "deluxe_king",
                        "bed_type": "King bed",
                        "view": "City view",
                        "size_sqm": 34,
                        "occupancy_adults": 2,
                        "max_occupancy": 3,
                        "facilities": ["Free WiFi", "Minibar", "Air conditioning"],
                        "extraction_note": "Normalized from 'SUP KING BED'",
                        "rate_plans": [
                            {
                                "base_price": 8100,
                                "meal_plan": "Room only",
                                "refundable": True,
                                "cancellation_deadline_hours": 48,
                                "cancellation_policy_note": "Free cancellation until 48 hours before arrival",
                                "payment_terms": "Pay at hotel",
                                "rooms_available": 2,
                            }
                        ],
                    }
                ],
            },
        ],
    },
]

# Hard negatives: similar names, different properties. These must never merge.
STANDALONE_LISTINGS = [
    {
        "category": "hotel",
        "supplier": "ATLAS",
        "supplier_property_id": "GP-DEL-20877",
        "name": "Grand Imperial Guest House",
        "address": "Main Bazaar, Paharganj, New Delhi 110055",
        "city": "New Delhi",
        "region": "Delhi NCR",
        "latitude": 28.6420,
        "longitude": 77.2100,
        "star_rating": 3.0,
        "amenities": ["Free WiFi", "Room service", "Laundry"],
        "content_completeness": 61,
        "rooms": [
            {
                "room_category": "Standard Double",
                "equivalence_class": "standard_double",
                "bed_type": "Double bed",
                "view": "Street view",
                "size_sqm": 16,
                "occupancy_adults": 2,
                "max_occupancy": 2,
                "facilities": ["Free WiFi"],
                "extraction_note": "Budget guest house, unrelated to the 5-star property",
                "rate_plans": [
                    {
                        "base_price": 1450,
                        "meal_plan": "Room only",
                        "refundable": False,
                        "cancellation_deadline_hours": None,
                        "cancellation_policy_note": "Non-refundable at all times",
                        "payment_terms": "Pay now",
                        "rooms_available": 3,
                    }
                ],
            }
        ],
    },
    {
        "category": "hotel",
        "supplier": "HORIZON",
        "supplier_property_id": "HZN-IN-6612",
        "name": "Grand Imperial Residency Suites",
        "address": "Karol Bagh, New Delhi 110005",
        "city": "New Delhi",
        "region": "Delhi NCR",
        "latitude": 28.6519,
        "longitude": 77.1901,
        "star_rating": 4.0,
        "amenities": ["Free WiFi", "Restaurant", "Fitness centre"],
        "content_completeness": 68,
        "rooms": [
            {
                "room_category": "Executive Room",
                "equivalence_class": "standard_double",
                "bed_type": "Queen bed",
                "view": "City view",
                "size_sqm": 24,
                "occupancy_adults": 2,
                "max_occupancy": 3,
                "facilities": ["Free WiFi", "Air conditioning"],
                "extraction_note": "Separate 4-star property ~2.7 km from the Grand Imperial",
                "rate_plans": [
                    {
                        "base_price": 3900,
                        "meal_plan": "Breakfast",
                        "refundable": True,
                        "cancellation_deadline_hours": 24,
                        "cancellation_policy_note": "Free cancellation until 24 hours before arrival",
                        "payment_terms": "Pay at hotel",
                        "rooms_available": 4,
                    }
                ],
            }
        ],
    },
]
