/**
 * Tattoo Deposit Lifecycle State Machine
 *
 * States: PENDING_DEPOSIT, DEPOSIT_PAID, CONFIRMED, IN_PROGRESS, COMPLETED, NO_SHOW, DISPUTED, REFUNDED
 *
 * State Transition Diagram:
 * PENDING_DEPOSIT -> DEPOSIT_PAID (payment confirmed)
 * DEPOSIT_PAID -> CONFIRMED (artist accepted)
 * CONFIRMED -> IN_PROGRESS (client arrived)
 * CONFIRMED -> NO_SHOW (past appointment time + grace period)
 * IN_PROGRESS -> COMPLETED (artist marked done)
 * NO_SHOW -> DISPUTED (within dispute window)
 * DISPUTED -> REFUNDED (dispute resolved in client favor)
 * DISPUTED -> NO_SHOW (dispute resolved in artist favor)
 */

const STATES = {
  PENDING_DEPOSIT: 'PENDING_DEPOSIT',
  DEPOSIT_PAID: 'DEPOSIT_PAID',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
  DISPUTED: 'DISPUTED',
  REFUNDED: 'REFUNDED'
};

const EVENTS = {
  PAY_DEPOSIT: 'PAY_DEPOSIT',
  ARTIST_CONFIRM: 'ARTIST_CONFIRM',
  CLIENT_ARRIVE: 'CLIENT_ARRIVE',
  MARK_NO_SHOW: 'MARK_NO_SHOW',
  ARTIST_COMPLETE: 'ARTIST_COMPLETE',
  DISPUTE: 'DISPUTE',
  RESOLVE_CLIENT_FAVOR: 'RESOLVE_CLIENT_FAVOR',
  RESOLVE_ARTIST_FAVOR: 'RESOLVE_ARTIST_FAVOR'
};

/**
 * Transition definitions with guard functions.
 * Each transition has: from, to, event, guard(context) => boolean
 */
const transitions = [
  {
    from: STATES.PENDING_DEPOSIT,
    to: STATES.DEPOSIT_PAID,
    event: EVENTS.PAY_DEPOSIT,
    guard: (context) => context.paymentConfirmed === true
  },
  {
    from: STATES.DEPOSIT_PAID,
    to: STATES.CONFIRMED,
    event: EVENTS.ARTIST_CONFIRM,
    guard: (context) => context.artistAccepted === true
  },
  {
    from: STATES.CONFIRMED,
    to: STATES.IN_PROGRESS,
    event: EVENTS.CLIENT_ARRIVE,
    guard: (context) => context.clientArrived === true
  },
  {
    from: STATES.CONFIRMED,
    to: STATES.NO_SHOW,
    event: EVENTS.MARK_NO_SHOW,
    guard: (context) => context.pastAppointmentTime === true && context.gracePeriodElapsed === true
  },
  {
    from: STATES.IN_PROGRESS,
    to: STATES.COMPLETED,
    event: EVENTS.ARTIST_COMPLETE,
    guard: (context) => context.artistMarkedDone === true
  },
  {
    from: STATES.NO_SHOW,
    to: STATES.DISPUTED,
    event: EVENTS.DISPUTE,
    guard: (context) => context.withinDisputeWindow === true
  },
  {
    from: STATES.DISPUTED,
    to: STATES.REFUNDED,
    event: EVENTS.RESOLVE_CLIENT_FAVOR,
    guard: (context) => context.disputeResolvedInClientFavor === true
  },
  {
    from: STATES.DISPUTED,
    to: STATES.NO_SHOW,
    event: EVENTS.RESOLVE_ARTIST_FAVOR,
    guard: (context) => context.disputeResolvedInArtistFavor === true
  }
];

/**
 * Attempt a state transition.
 * @param {string} currentState - Current state of the booking
 * @param {string} event - Event triggering the transition
 * @param {object} context - Context object for guard evaluation
 * @returns {string} New state after transition
 * @throws {Error} If transition is not valid or guard fails
 */
function transition(currentState, event, context) {
  const validTransition = transitions.find(
    (t) => t.from === currentState && t.event === event
  );

  if (!validTransition) {
    throw new Error(
      `Invalid transition: no transition from "${currentState}" with event "${event}"`
    );
  }

  if (!validTransition.guard(context || {})) {
    throw new Error(
      `Guard failed: transition from "${currentState}" via "${event}" - conditions not met`
    );
  }

  return validTransition.to;
}

/**
 * Check if a transition is possible without executing it.
 * @param {string} currentState - Current state of the booking
 * @param {string} event - Event to check
 * @param {object} context - Context object for guard evaluation
 * @returns {boolean} Whether the transition can be made
 */
function canTransition(currentState, event, context) {
  const validTransition = transitions.find(
    (t) => t.from === currentState && t.event === event
  );

  if (!validTransition) {
    return false;
  }

  try {
    return validTransition.guard(context || {});
  } catch (e) {
    return false;
  }
}

/**
 * Get all available transitions from the current state.
 * @param {string} currentState - Current state of the booking
 * @returns {Array<{event: string, targetState: string}>} Available transitions
 */
function getAvailableTransitions(currentState) {
  return transitions
    .filter((t) => t.from === currentState)
    .map((t) => ({
      event: t.event,
      targetState: t.to
    }));
}

module.exports = {
  STATES,
  EVENTS,
  transition,
  canTransition,
  getAvailableTransitions
};
