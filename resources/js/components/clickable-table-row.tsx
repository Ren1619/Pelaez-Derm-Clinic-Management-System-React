import type {
    ComponentPropsWithoutRef,
    KeyboardEvent,
    MouseEvent,
} from 'react';
import { cn } from '@/lib/utils';

const interactiveElementSelector = [
    'a',
    'button',
    'input',
    'select',
    'textarea',
    '[contenteditable="true"]',
    '[data-row-action]',
].join(',');

type ClickableTableRowProps = Omit<
    ComponentPropsWithoutRef<'tr'>,
    'onClick' | 'onKeyDown'
> & {
    accessibleLabel: string;
    activationRole?: 'button' | 'link';
    onActivate: () => void;
};

function hasSelectedText(row: HTMLTableRowElement): boolean {
    const selection = window.getSelection();

    return Boolean(
        selection &&
        !selection.isCollapsed &&
        selection.toString() &&
        selection.anchorNode &&
        row.contains(selection.anchorNode),
    );
}

function isInteractiveElement(target: EventTarget | null): boolean {
    return (
        target instanceof Element &&
        target.closest(interactiveElementSelector) !== null
    );
}

export function ClickableTableRow({
    accessibleLabel,
    activationRole = 'button',
    className,
    onActivate,
    ...props
}: ClickableTableRowProps) {
    const handleClick = (event: MouseEvent<HTMLTableRowElement>) => {
        if (
            event.defaultPrevented ||
            isInteractiveElement(event.target) ||
            hasSelectedText(event.currentTarget)
        ) {
            return;
        }

        onActivate();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
        if (
            event.target !== event.currentTarget ||
            (event.key !== 'Enter' && event.key !== ' ')
        ) {
            return;
        }

        event.preventDefault();
        onActivate();
    };

    return (
        <tr
            {...props}
            role={activationRole}
            tabIndex={0}
            aria-label={accessibleLabel}
            className={cn(
                'cursor-pointer transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset',
                className,
            )}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        />
    );
}
