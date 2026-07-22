import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

type TooltipIconButtonProps = ComponentProps<typeof Button> & {
    tooltip: ReactNode;
};

export function TooltipIconButton({
    'aria-label': ariaLabel,
    tooltip,
    ...props
}: TooltipIconButtonProps) {
    const accessibleLabel =
        ariaLabel ?? (typeof tooltip === 'string' ? tooltip : undefined);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button aria-label={accessibleLabel} {...props} />
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
    );
}
