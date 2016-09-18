import getOppositePlacement from '../utils/getOppositePlacement';
import getPopperClientRect from '../utils/getPopperClientRect';
import isModifierRequired from '../utils/isModifierRequired';
import runModifiers from '../utils/runModifiers';

/**
 * Modifier used to flip the placement of the popper when the latter is starting overlapping its reference element.
 * Requires the `preventOverflow` modifier before it in order to work.
 * **NOTE:** data.instance modifier will run all its previous modifiers everytime it tries to flip the popper!
 * @method
 * @memberof Modifiers
 * @argument {Object} data - The data object generated by update method
 * @argument {Object} options - Modifiers configuration and options
 * @returns {Object} The data object, properly modified
 */
export default function flip(data, options) {
    // check if preventOverflow is in the list of modifiers before the flip modifier.
    // otherwise flip would not work as expected.
    if (!isModifierRequired(data.instance.modifiers, 'flip', 'preventOverflow')) {
        console.warn('WARNING: preventOverflow modifier is required by flip modifier in order to work, be sure to include it before flip!');
        return data;
    }

    // we need to get the computed original placement (not `auto`)
    // in order to properly detect flip loops
    let originalPlacement = data.originalPlacement;
    if (originalPlacement.indexOf('auto') !== -1) {
        originalPlacement = data.originalComputedPlacement;
    }

    // seems like flip is trying to loop, probably there's not enough space on any of the flippable sides
    if (data.flipped && data.placement === originalPlacement) {
        return data;
    }

    let placement = data.placement.split('-')[0];
    let placementOpposite = getOppositePlacement(placement);
    const variation = data.placement.split('-')[1] || '';

    let flipOrder = [];
    if(options.behavior === 'flip') {
        flipOrder = [
            placement,
            placementOpposite
        ];
    } else {
        flipOrder = options.behavior;
    }

    flipOrder.forEach((step, index) => {
        if (placement !== step || flipOrder.length === index + 1) {
            return data;
        }

        placement = data.placement.split('-')[0];
        placementOpposite = getOppositePlacement(placement);

        const popperOffsets = getPopperClientRect(data.offsets.popper);

        // this boolean is used to distinguish right and bottom from top and left
        // they need different computations to get flipped
        const a = ['right', 'bottom'].indexOf(placement) !== -1;

        // using Math.floor because the reference offsets may contain decimals we are not going to consider here
        if (
            a && Math.floor(data.offsets.reference[placement]) > Math.floor(popperOffsets[placementOpposite]) ||
            !a && Math.floor(data.offsets.reference[placement]) < Math.floor(popperOffsets[placementOpposite])
        ) {
            // this boolean to detect any flip loop
            data.flipped = true;
            data.placement = flipOrder[index + 1];
            if (variation) {
                data.placement += '-' + variation;
            }
            data = runModifiers(data.instance.modifiers, data.instance.options, data, 'flip');
        }
    });
    return data;
}
