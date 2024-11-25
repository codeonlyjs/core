// HTML tokenizer
export function tokenizer(str)
{
    let pos = 0;
    let end = str.length;
    let intag = false;

    return function nextToken(mode)
    {
        let start = pos;
        let token = nextTokenInternal(mode);
        token.start = start;
        token.end = pos;
        return token;
    }

    function nextTokenInternal(mode)
    {
        if (pos >= end)
            return { token: '\0' };

        if (mode && mode.startsWith("/"))
        {
            let rx = new RegExp(`<\/${mode.substring(1)}\s*>`, "gi");
            rx.lastIndex = pos;
            let m = rx.exec(str);
            let innerEnd = m ? m.index : end;
            let text = str.substring(pos, innerEnd);
            pos = innerEnd;
            return { token: "text", text };
        }

        if (!intag && char() == '<')
            {
            // Comment?
            if (char(1) == '!' && char(2) == '-' && char(3) == '-')
            {
                pos += 4;
                let start = pos;
                while (pos < end && !(char() == '-' && char(1) == '-' && char(2) == '>'))
                    pos++;
                let comment = str.substring(start, pos);
                if (pos < end)
                    pos+=3;
                return { token: "comment", comment };
            }
            
            intag = true;
            if (char(1) == '/')
            {
                pos += 2;
                return { token: "</" };
            }
        }
            
        if (intag)
        {
            // Skip whitespace
            while (is_whitespace(char()))
                pos++;

            // Quoted string
            if (char() == '\"' || char() == '\'')
            {
                let term = char();
                pos++;
                let start = pos;
                while (pos < end && str[pos] != term)
                    pos++;
                let val = str.substring(start, pos);
                if (str[pos] == term)
                    pos++;
                return { token: "string", string: val }
            }

            // Unquoted attribute value
            if (mode == "attribute" && is_attribute_value_char(char()))
            {
                let start = pos;
                pos++;
                while (is_attribute_value_char(char()))
                    pos++;
                return { token: "string", string: str.substring(start, pos) }
            }

            // Identifier
            if (is_identifier_leadchar(char()))
            {
                let start = pos;
                pos++;
                while (is_identifier_char(char()))
                    pos++;
                return { token: "identifier", identifier: str.substring(start, pos) };
            }

            switch (char())
            {
                case '/':
                    if (char(1) == '>')
                    {
                        pos += 2;
                        intag = false;
                        return { token: '/>' };
                    }
                    else
                    {
                        pos++;
                        return { token: '/' };
                    }
                
                case '>':
                    intag = false;
                    break;
            }

            return { token: str[pos++] }
        }
        else
        {
            let start = pos;
            while (pos < end && str[pos] != '<')
                pos++;

            return { token: "text", text: str.substring(start, pos) };
        }
    }

    function char(offset)
    {
        if (!offset)
            offset = 0;
        if (pos + offset >= 0 && pos + offset < end)
            return str[pos + offset];
        return '\0';
    }

    function is_whitespace(char)
    {
        return char == ' ' || char == '\t' || char == '\r' || char == '\n' || char == '\t';
    }

    function is_identifier_leadchar(char)
    {
        return char == ':' || char == '_' || (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
    }
    
    function is_identifier_char(char)
    {
        return is_identifier_leadchar(char) || is_digit(char) || char == '.' || char == '-';
    }

    function is_attribute_value_char(char)
    {
        return !(is_whitespace(char) || char == '\"' || char == '\'' || char == '=' || char == '<' || char == '>' || char == '`' || char == '/')
    }

    function is_digit(char)
    {
        return char >= '0' && char <= '9';
    }
}

