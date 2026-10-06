import { useState, useRef, useCallback, useEffect } from 'react';
import { FlowchartNodeId, EngagementMode, CartData, CartItem, TelemetryLog } from '../types/flowchart';
import { PRODUCTS, ProductItem } from '../components/ProductCards';
import { COLLECTIONS } from '../components/CollectionCards';

const INITIAL_CART: CartData = {
  cartId: '',
  checkoutId: '',
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  continuationUrls: {
    cartUrl: 'https://store.anigok.com/cart',
    checkoutUrl: 'https://store.anigok.com/checkouts/cn_pending',
  },
};

export function useInteractionFlow() {
  const [currentNode, setCurrentNode] = useState<FlowchartNodeId>('B');
  const [engagementMode, setEngagementMode] = useState<EngagementMode | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>(COLLECTIONS[0].id);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [cart, setCart] = useState<CartData>(INITIAL_CART);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState<boolean>(false);
  const [cartConfirmToast, setCartConfirmToast] = useState<{
    show: boolean;
    cartId: string;
    checkoutId: string;
    productTitle: string;
  } | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);

  const autoPlayTimeoutRef = useRef<NodeJS.Timeout[]>([]);

  const addLog = useCallback(
    (nodeId: FlowchartNodeId, type: TelemetryLog['type'], title: string, detail?: string, data?: any) => {
      const newLog: TelemetryLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        nodeId,
        type,
        title,
        detail,
        data,
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    },
    []
  );

  // Initialize with Page Load -> Widget Idle log
  useEffect(() => {
    addLog('A', 'info', 'Page Loaded', 'Host window mounted. No catalog request or UI action.');
    addLog('B', 'info', 'Widget Idle', 'Widget passive in DOM. Ready for customer engagement.');
  }, [addLog]);

  const clearAutoPlayTimeouts = useCallback(() => {
    autoPlayTimeoutRef.current.forEach(clearTimeout);
    autoPlayTimeoutRef.current = [];
    setIsAutoPlaying(false);
  }, []);

  // Jump to specific node directly for testing
  const jumpToNode = useCallback(
    (targetNode: FlowchartNodeId) => {
      clearAutoPlayTimeouts();
      setCurrentNode(targetNode);
      addLog(targetNode, 'ui', `Manual Transition -> [${targetNode}]`, `State manually set to ${targetNode}`);

      if (['A', 'B'].includes(targetNode)) {
        setIsWidgetOpen(false);
        setIsMinimized(false);
        setEngagementMode(null);
      } else if (['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'AB'].includes(targetNode)) {
        setIsWidgetOpen(true);
        setIsMinimized(false);
        if (!engagementMode) setEngagementMode('voice');
      } else if (['Y', 'Z', 'AA', 'AC'].includes(targetNode)) {
        setIsMinimized(true);
        setIsWidgetOpen(false);
      }

      if (['N', 'O', 'P', 'Q', 'R', 'S'].includes(targetNode) && !selectedProduct) {
        setSelectedProduct(PRODUCTS[0]);
      }
    },
    [addLog, clearAutoPlayTimeouts, engagementMode, selectedProduct]
  );

  // Step 1: Customer Engages the Widget (C -> D -> E -> F -> G -> H -> I -> J)
  const engageWidget = useCallback(
    (mode: EngagementMode) => {
      clearAutoPlayTimeouts();
      setEngagementMode(mode);
      setIsWidgetOpen(true);
      setIsMinimized(false);

      // Node C: Customer engages the widget
      setCurrentNode('C');
      addLog(
        'C',
        'ui',
        `Customer Engaged via ${mode.toUpperCase()}`,
        `Trigger: ${mode === 'chat' ? 'Chat opens' : mode === 'voice' ? 'Voice call starts' : 'Video or FaceTime connects'}`
      );

      // Move to D: Connecting State
      const t1 = setTimeout(() => {
        setCurrentNode('D');
        addLog('D', 'network', 'Connecting State', 'WebRTC negotiation & session initialization...');

        // Move to E: Session starts in background
        const t2 = setTimeout(() => {
          setCurrentNode('E');
          addLog(
            'E',
            'agent',
            'Session Starts in Background',
            'Background session established (Not shown to customer).'
          );

          // Move to F: Agent instruction
          const t3 = setTimeout(() => {
            setCurrentNode('F');
            addLog(
              'F',
              'agent',
              'Agent Instruction Received',
              'Instruction: "Search catalog quietly; do not respond or speak yet."'
            );

            // Move to G: Agent fetches collections
            const t4 = setTimeout(() => {
              setCurrentNode('G');
              addLog(
                'G',
                'tool',
                'Tool: search_catalog(scope: "guided_collections")',
                'Quietly fetched 10 featured collections and top products.'
              );

              // Move to H: UI quietly renders guided collections
              const t5 = setTimeout(() => {
                setCurrentNode('H');
                addLog('H', 'ui', 'UI Quietly Renders Collections', 'Collections shelf and catalog buffer mounted.');

                // Move to I: Connecting state ends; widget becomes Live
                const t6 = setTimeout(() => {
                  setCurrentNode('I');
                  addLog('I', 'agent', 'Connecting State Ends; Widget Live', 'Visualizer live, microphone listening.');

                  // Move to J: Discovery View
                  const t7 = setTimeout(() => {
                    setCurrentNode('J');
                    addLog('J', 'ui', 'Discovery View Active', 'Customer is viewing guided collections & discovery feed.');
                  }, 400);
                  autoPlayTimeoutRef.current.push(t7);
                }, 500);
                autoPlayTimeoutRef.current.push(t6);
              }, 450);
              autoPlayTimeoutRef.current.push(t5);
            }, 500);
            autoPlayTimeoutRef.current.push(t4);
          }, 450);
          autoPlayTimeoutRef.current.push(t3);
        }, 400);
        autoPlayTimeoutRef.current.push(t2);
      }, 500);
      autoPlayTimeoutRef.current.push(t1);
    },
    [addLog, clearAutoPlayTimeouts]
  );

  // Step 2: Customer explores a collection (J -> K -> L -> M -> N)
  const exploreCollection = useCallback(
    (collectionId: string, method: 'click' | 'ask' = 'click') => {
      setSelectedCollection(collectionId);
      const collectionObj = COLLECTIONS.find((c) => c.id === collectionId) || COLLECTIONS[0];

      setCurrentNode('K');
      addLog(
        'K',
        'ui',
        'Customer Explores Collection',
        method === 'click' ? `Clicked collection: ${collectionObj.name}` : `Asked about collection: ${collectionObj.name}`
      );

      // Node L: Selection is sent to agent
      const t1 = setTimeout(() => {
        setCurrentNode('L');
        addLog(
          'L',
          'agent',
          'Selection Sent to Agent',
          `Payload: { action: "explore_collection", collectionId: "${collectionId}", name: "${collectionObj.name}" }`
        );

        // Node M: Agent provides collection or product details
        const t2 = setTimeout(() => {
          setCurrentNode('M');
          const matchedProduct = PRODUCTS.find((p) => p.id.includes(collectionId.slice(0, 4))) || PRODUCTS[0];
          setSelectedProduct(matchedProduct);
          addLog(
            'M',
            'agent',
            'Agent Responded with Product Details',
            `Matched spotlight product: "${matchedProduct.title}" (${matchedProduct.price})`
          );

          // Node N: Detail View
          const t3 = setTimeout(() => {
            setCurrentNode('N');
            addLog('N', 'ui', 'Detail View Mounted', `Showing specifications, variant options, and Add to Bag for ${matchedProduct.title}.`);
          }, 400);
          autoPlayTimeoutRef.current.push(t3);
        }, 500);
        autoPlayTimeoutRef.current.push(t2);
      }, 400);
      autoPlayTimeoutRef.current.push(t1);
    },
    [addLog]
  );

  // Directly select a product from the shelf
  const selectProductDetail = useCallback(
    (product: ProductItem) => {
      setSelectedProduct(product);
      setCurrentNode('K');
      addLog('K', 'ui', 'Product Card Clicked', `Selected: ${product.title}`);

      const t1 = setTimeout(() => {
        setCurrentNode('L');
        addLog('L', 'agent', 'Product Inquiry Sent to Agent', `Product ID: ${product.id}`);

        const t2 = setTimeout(() => {
          setCurrentNode('M');
          addLog('M', 'agent', 'Product Specs Delivered', `${product.title} rating ${product.rating} stars`);

          const t3 = setTimeout(() => {
            setCurrentNode('N');
            addLog('N', 'ui', 'Detail View Open', `Detail View ready for customer action.`);
          }, 350);
          autoPlayTimeoutRef.current.push(t3);
        }, 400);
        autoPlayTimeoutRef.current.push(t2);
      }, 350);
      autoPlayTimeoutRef.current.push(t1);
    },
    [addLog]
  );

  // Step 3: Customer Action in Detail View (N -> O -> Keep Browsing (J) OR Add to Cart (P -> Q -> R -> S -> J))
  const keepBrowsing = useCallback(() => {
    setCurrentNode('O');
    addLog('O', 'ui', 'Customer Action: Keep Browsing', 'Returning to Discovery View.');
    const t = setTimeout(() => {
      setCurrentNode('J');
      addLog('J', 'ui', 'Back in Discovery View', 'Collections and carousel active.');
    }, 400);
    autoPlayTimeoutRef.current.push(t);
  }, [addLog]);

  const addToCart = useCallback(
    (productOverride?: ProductItem) => {
      const prod = productOverride || selectedProduct || PRODUCTS[0];
      setCurrentNode('O');
      addLog('O', 'ui', 'Customer Action: Add to Cart', `User clicked Add to Bag for "${prod.title}".`);

      // Node P: Agent calls add-to-cart tool
      const t1 = setTimeout(() => {
        setCurrentNode('P');
        const generatedCartId = 'cart_' + Math.random().toString(36).substring(2, 10);
        const generatedCheckoutId = 'ckt_' + Math.random().toString(36).substring(2, 10);
        addLog(
          'P',
          'tool',
          'Agent Calls: add_to_cart() Tool',
          `Payload: { productId: "${prod.id}", variant: "Default", qty: 1 }`
        );

        // Node Q: API returns cart ID, checkout ID, and continuation URLs
        const t2 = setTimeout(() => {
          setCurrentNode('Q');
          const numeric = parseFloat(prod.price.replace(/[^0-9.]/g, '')) || 199;
          const continuation = {
            cartUrl: `https://store.anigok.com/cart?token=${generatedCartId}`,
            checkoutUrl: `https://store.anigok.com/checkouts/${generatedCheckoutId}`,
          };

          const newCartItem: CartItem = {
            id: prod.id,
            title: prod.title,
            price: prod.price,
            numericPrice: numeric,
            image: prod.image,
            qty: 1,
            variant: 'Midnight Black / Standard',
          };

          setCart((prev) => {
            const existingIndex = prev.items.findIndex((i) => i.id === prod.id);
            let updatedItems: CartItem[];
            if (existingIndex >= 0) {
              updatedItems = prev.items.map((it, idx) => (idx === existingIndex ? { ...it, qty: it.qty + 1 } : it));
            } else {
              updatedItems = [...prev.items, newCartItem];
            }
            const subtotal = updatedItems.reduce((acc, curr) => acc + curr.numericPrice * curr.qty, 0);
            const tax = subtotal * 0.0825;
            const total = subtotal + tax;
            return {
              cartId: generatedCartId,
              checkoutId: generatedCheckoutId,
              items: updatedItems,
              subtotal,
              tax,
              total,
              continuationUrls: continuation,
            };
          });

          addLog(
            'Q',
            'network',
            'API Returns Cart & Continuation URLs',
            `cartId: ${generatedCartId} | checkoutId: ${generatedCheckoutId} | continuationUrl: ${continuation.checkoutUrl}`
          );

          // Node R: cartConfirm toast
          const t3 = setTimeout(() => {
            setCurrentNode('R');
            setCartConfirmToast({
              show: true,
              cartId: generatedCartId,
              checkoutId: generatedCheckoutId,
              productTitle: prod.title,
            });
            addLog('R', 'ui', 'cartConfirm Toast Rendered', `Toast shown: Added to Cart. Cart ID: ${generatedCartId}`);

            // Node S: Remain on the current discovery or detail view
            const t4 = setTimeout(() => {
              setCurrentNode('S');
              addLog('S', 'ui', 'Remain on Current View', 'View preserved without disruptive navigation.');

              const t5 = setTimeout(() => {
                // Transition back to J (Discovery View) or stay in N based on state
                setCurrentNode('J');
                addLog('J', 'ui', 'Discovery View Ready', 'Cart updated with active line item.');
              }, 600);
              autoPlayTimeoutRef.current.push(t5);
            }, 1200);
            autoPlayTimeoutRef.current.push(t4);
          }, 400);
          autoPlayTimeoutRef.current.push(t3);
        }, 500);
        autoPlayTimeoutRef.current.push(t2);
      }, 400);
      autoPlayTimeoutRef.current.push(t1);
    },
    [addLog, selectedProduct]
  );

  // Step 4: Customer Requests a Transaction (J -> T -> U or V -> W -> X -> Y -> Z)
  const requestTransaction = useCallback(
    (actionType: 'view_cart' | 'checkout' | 'continue_shopping') => {
      setCurrentNode('T');
      addLog(
        'T',
        'ui',
        'Customer Requests Transaction',
        actionType === 'view_cart'
          ? 'Customer requested: "View cart"'
          : actionType === 'checkout'
          ? 'Customer requested: "Checkout / Asks for total"'
          : 'Customer requested: "Continue shopping"'
      );

      if (actionType === 'continue_shopping') {
        const t = setTimeout(() => {
          setCurrentNode('J');
          addLog('J', 'ui', 'Continue Shopping', 'Returned to discovery view.');
        }, 400);
        autoPlayTimeoutRef.current.push(t);
        return;
      }

      if (actionType === 'view_cart') {
        const t1 = setTimeout(() => {
          setCurrentNode('U');
          addLog('U', 'agent', 'Agent Retrieves Cart URL', `URL: ${cart.continuationUrls.cartUrl || 'https://store.anigok.com/cart'}`);

          // Node W: external_redirect view
          const t2 = setTimeout(() => {
            setCurrentNode('W');
            addLog('W', 'ui', 'external_redirect View', 'UI preparing redirect to merchant cart.');
            startRedirectExecution(cart.continuationUrls.cartUrl);
          }, 500);
          autoPlayTimeoutRef.current.push(t2);
        }, 400);
        autoPlayTimeoutRef.current.push(t1);
      } else {
        // Checkout or asks for total
        const t1 = setTimeout(() => {
          setCurrentNode('V');
          addLog(
            'V',
            'agent',
            'Agent Creates Checkout; Storefront Calculates Totals',
            `Subtotal: $${cart.subtotal.toFixed(2)}, Tax: $${cart.tax.toFixed(2)}, Total: $${cart.total.toFixed(2)}`
          );

          // Node W: external_redirect view
          const t2 = setTimeout(() => {
            setCurrentNode('W');
            addLog('W', 'ui', 'external_redirect View', `Target: ${cart.continuationUrls.checkoutUrl}`);
            startRedirectExecution(cart.continuationUrls.checkoutUrl);
          }, 500);
          autoPlayTimeoutRef.current.push(t2);
        }, 400);
        autoPlayTimeoutRef.current.push(t1);
      }
    },
    [addLog, cart]
  );

  // Helper for W -> X -> Y -> Z
  const startRedirectExecution = useCallback(
    (targetUrl: string) => {
      setRedirectCountdown(3);

      const t1 = setTimeout(() => {
        setRedirectCountdown(2);
      }, 700);
      autoPlayTimeoutRef.current.push(t1);

      const t2 = setTimeout(() => {
        setRedirectCountdown(1);
      }, 1400);
      autoPlayTimeoutRef.current.push(t2);

      const t3 = setTimeout(() => {
        setRedirectCountdown(null);
        setCurrentNode('X');
        addLog('X', 'ui', 'UI Executes: window.location.href = URL', `Dispatching navigation: ${targetUrl}`);

        // Node Y: Merchant cart or checkout page
        const t4 = setTimeout(() => {
          setCurrentNode('Y');
          addLog('Y', 'network', 'Merchant Cart or Checkout Page Mounted', 'Storefront checkout loaded in active viewport.');

          // Node Z: Widget minimizes; session stays active
          const t5 = setTimeout(() => {
            setCurrentNode('Z');
            setIsMinimized(true);
            setIsWidgetOpen(false);
            addLog(
              'Z',
              'agent',
              'Widget Minimizes; Session Stays Active',
              'Docked to high-gloss minimized bubble. Audio/session continuously connected.'
            );
          }, 800);
          autoPlayTimeoutRef.current.push(t5);
        }, 800);
        autoPlayTimeoutRef.current.push(t4);
      }, 2100);
      autoPlayTimeoutRef.current.push(t3);
    },
    [addLog]
  );

  // Step 5: Customer Needs Help on Merchant Checkout Page? (Z -> AA -> AB or AC)
  const askCustomerHelp = useCallback(
    (needsHelp: boolean) => {
      setCurrentNode('AA');
      addLog('AA', 'ui', 'Customer Needs Help?', needsHelp ? 'Customer requested live agent help.' : 'Checkout completed successfully.');

      if (needsHelp) {
        // Node AB: Agent remains available
        const t1 = setTimeout(() => {
          setCurrentNode('AB');
          setIsMinimized(false);
          setIsWidgetOpen(true);
          addLog('AB', 'agent', 'Agent Remains Available', 'Widget re-expanded. Instant voice/chat assistance ready.');
        }, 400);
        autoPlayTimeoutRef.current.push(t1);
      } else {
        // Node AC: Checkout complete; session continues
        const t1 = setTimeout(() => {
          setCurrentNode('AC');
          addLog(
            'AC',
            'session',
            'Checkout Complete; Session Continues',
            'Order #AN-88942 Confirmed! Session persists for tracking, receipts, and returns.'
          );
        }, 400);
        autoPlayTimeoutRef.current.push(t1);
      }
    },
    [addLog]
  );

  // Full Automated Scenario Player: Plays the entire flowchart from start to finish!
  const playFullScenario = useCallback(() => {
    clearAutoPlayTimeouts();
    setIsAutoPlaying(true);
    setCart(INITIAL_CART);
    setSelectedProduct(PRODUCTS[0]);
    setIsMinimized(false);
    setIsWidgetOpen(false);

    setCurrentNode('A');
    addLog('A', 'info', '[Scenario] Page Load started', 'Simulating brand new page load');

    const t1 = setTimeout(() => {
      setCurrentNode('B');
      addLog('B', 'info', '[Scenario] Widget Idle', 'No catalog requests or UI actions');

      const t2 = setTimeout(() => {
        // C: Engage via voice
        engageWidget('voice');

        // After Discovery View is reached (approx 4.2s), simulate collection exploration
        const t3 = setTimeout(() => {
          exploreCollection('spatial-audio', 'click');

          // After Detail View is reached, add to cart
          const t4 = setTimeout(() => {
            addToCart(PRODUCTS[0]);

            // After toast and return to discovery, request checkout
            const t5 = setTimeout(() => {
              requestTransaction('checkout');

              // After minimized checkout page is reached, simulate customer asking for help
              const t6 = setTimeout(() => {
                askCustomerHelp(true);

                // Finally complete checkout
                const t7 = setTimeout(() => {
                  askCustomerHelp(false);
                  setIsAutoPlaying(false);
                }, 4000);
                autoPlayTimeoutRef.current.push(t7);
              }, 8500);
              autoPlayTimeoutRef.current.push(t6);
            }, 4500);
            autoPlayTimeoutRef.current.push(t5);
          }, 3500);
          autoPlayTimeoutRef.current.push(t4);
        }, 4800);
        autoPlayTimeoutRef.current.push(t3);
      }, 1000);
      autoPlayTimeoutRef.current.push(t2);
    }, 800);
    autoPlayTimeoutRef.current.push(t1);
  }, [addLog, addToCart, askCustomerHelp, clearAutoPlayTimeouts, engageWidget, exploreCollection, requestTransaction]);

  const resetFlow = useCallback(() => {
    clearAutoPlayTimeouts();
    setCurrentNode('B');
    setEngagementMode(null);
    setSelectedProduct(null);
    setCart(INITIAL_CART);
    setIsMinimized(false);
    setIsWidgetOpen(false);
    setCartConfirmToast(null);
    setRedirectCountdown(null);
    addLog('B', 'info', 'Flowchart Reset', 'Reset to initial Idle state.');
  }, [addLog, clearAutoPlayTimeouts]);

  return {
    currentNode,
    engagementMode,
    selectedCollection,
    selectedProduct,
    cart,
    isMinimized,
    isWidgetOpen,
    cartConfirmToast,
    redirectCountdown,
    isAutoPlaying,
    logs,
    setIsWidgetOpen,
    setIsMinimized,
    setCartConfirmToast,
    engageWidget,
    exploreCollection,
    selectProductDetail,
    keepBrowsing,
    addToCart,
    requestTransaction,
    askCustomerHelp,
    jumpToNode,
    playFullScenario,
    resetFlow,
    clearAutoPlayTimeouts,
  };
}
