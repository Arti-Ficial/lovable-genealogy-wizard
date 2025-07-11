import React from 'react';
import { Plus, Edit, Trash2, UserPlus, Baby } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';

type PersonContextMenuProps = {
  children: React.ReactNode;
  onAddPartner: () => void;
  onAddChild: () => void;
  onEditPerson: () => void;
  onDeletePerson: () => void;
};

const PersonContextMenu = ({ 
  children, 
  onAddPartner, 
  onAddChild, 
  onEditPerson, 
  onDeletePerson 
}: PersonContextMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onAddPartner}>
          <UserPlus className="mr-2 h-4 w-4" />
          Partner/in hinzufügen
        </ContextMenuItem>
        <ContextMenuItem onClick={onAddChild}>
          <Baby className="mr-2 h-4 w-4" />
          Kind hinzufügen
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onEditPerson}>
          <Edit className="mr-2 h-4 w-4" />
          Person bearbeiten
        </ContextMenuItem>
        <ContextMenuItem onClick={onDeletePerson} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Person löschen
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default PersonContextMenu;